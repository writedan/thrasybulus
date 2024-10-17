// Copyright (C) 2024  Daniel Write

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, version 3 of the License.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

use clap::{Parser};
use colored::Colorize;

#[derive(Parser)]
#[command(version, about, long_about = None, author = "Daniel Write")]
struct Cli {
    /// The interface on which to monitor ARP traffic.
    #[arg(short, long)]
    interface: String
}

fn main() {
    match entry() {
        Ok(_) => println!("{} Exited without error.", "Warning!".yellow().bold()),
        Err(why) => {
            println!("{}: {}", "Error".red().bold(), why);
            std::process::exit(1);
        }
    }
}

/// Helper method to convert SystemTime to rusqlite timestamps
fn system_time_to_date_time(t: std::time::SystemTime) -> chrono::DateTime<chrono::Utc> {
    use chrono::TimeZone;
    let (sec, nsec) = match t.duration_since(std::time::UNIX_EPOCH) {
        Ok(dur) => (dur.as_secs() as i64, dur.subsec_nanos()),
        Err(e) => { // unlikely but should be handled
            let dur = e.duration();
            let (sec, nsec) = (dur.as_secs() as i64, dur.subsec_nanos());
            if nsec == 0 {
                (-sec, 0)
            } else {
                (-sec - 1, 1_000_000_000 - nsec)
            }
        },
    };
    chrono::Utc.timestamp(sec, nsec)
}

fn entry() -> Result<(), String> {
    use pnet::datalink::{self, Channel};
    use pnet::packet::Packet;
    use pnet::packet::ethernet::{EthernetPacket, EtherType};
    use pnet::packet::arp::{ArpPacket};

    let cli = Cli::parse();

    let interfaces = datalink::interfaces();
    let interface = interfaces.iter().filter(|iface| {
        iface.name == cli.interface
    }).next();

    if let None = interface {
        return Err(format!("No such interface: {}", cli.interface.bright_black().bold()));
    }

    let interface = interface.unwrap();

    let mut config = datalink::Config::default();
    config.promiscuous = true; // Enable promiscuous mode
    config.read_timeout = None; // Set no timeout

    let (_tx, mut rx) = match datalink::channel(&interface, config) {
        Ok(Channel::Ethernet(tx, rx)) => (tx, rx),

        Ok(_) => {
            return Err("Unsupported channel type.".into());
        },

        Err(why) => {
            return Err(format!("Failed to initialize channel: {}", why.to_string().bright_black().bold()));
        }
    };

    let database = match rusqlite::Connection::open(format!("{}.db", cli.interface)) {
        Ok(db) => db,
        Err(why) => return Err(format!("Failed to initialize database: {}", why.to_string().bright_black().bold()))
    };

    match database.execute("CREATE TABLE IF NOT EXISTS arp_requests(id INTEGER PRIMARY KEY, source TEXT, dest TEXT, timestamp INTEGER);", ()) {
        Ok(_) => {},
        Err(why) => {
            return Err(format!("Failed to execute query: {}", why.to_string().bright_black().bold()));
        }
    };

    match database.execute("CREATE TABLE IF NOT EXISTS arp_replies(id INTEGER PRIMARY KEY, replier_ip TEXT, replier_mac TEXT, destination_ip TEXT, timestamp INTEGER)", ()) {
        Ok(_) => {},
        Err(why) => {
            return Err(format!("Failed to execute query: {}", why.to_string().bright_black().bold()));
        }
    };

    println!("Listening on interface: {}", cli.interface.bright_black().bold());

    loop {
        match rx.next() {
            Ok(packet) => {
                let eth_packet = match EthernetPacket::new(packet) {
                    Some(p) => p,
                    None => {
                        return Err(format!("{}: No packet to read.", "Error".red().bold()));
                    }
                };

                if eth_packet.get_ethertype() == EtherType(0x0806) {
                    if let Some(arp_packet) = ArpPacket::new(eth_packet.payload()) {
                        let pnet::packet::arp::ArpOperation(opcode) = arp_packet.get_operation();
                        if opcode == 1 {
                            // ARP REQUEST
                            let dest = arp_packet.get_target_proto_addr().to_string();
                            let source = arp_packet.get_sender_proto_addr().to_string();
                            let timestamp = system_time_to_date_time(std::time::SystemTime::now());
                            match database.execute("INSERT INTO arp_requests (source, dest, timestamp) VALUES(?1, ?2, ?3)", (&source, &dest, &timestamp)) {
                                Ok(_) => {},
                                Err(why) => {
                                    println!("{}: Failed to execute query: {}", "Error".red().bold(), why.to_string().bright_black().bold());
                                }
                            };
                            println!("{} {} asks for {}", "ARP REQUEST".blue(), source.bright_black().bold(), dest.bright_black().bold());
                        } else if opcode == 2 {
                            // ARP REPLY
                            let replier_ip = arp_packet.get_sender_proto_addr().to_string();
                            let replier_mac = arp_packet.get_sender_hw_addr().to_string();
                            let destination_ip = arp_packet.get_target_proto_addr().to_string();
                            let timestamp = system_time_to_date_time(std::time::SystemTime::now());
                            match database.execute("INSERT INTO arp_replies (replier_ip, replier_mac, destination_ip, timestamp) VALUES (?1, ?2, ?3, ?4)", (&replier_ip, &replier_mac, &destination_ip, &timestamp)) {
                                Ok(_) => {},
                                Err(why) => {
                                    println!("{}: Failed to execute query: {}", "Error".red().bold(), why.to_string().bright_black().bold());
                                }
                            };
                            println!("{} {} is at {} (replying to {})", "ARP REPLY  ".blue(), replier_ip.bright_black().bold(), replier_mac.bright_black().bold(), destination_ip.bright_black().bold());
                        }
                    } else {
                        println!("{}: Could not parse ARP packet", "Error".red().bold());
                    }
                }
            },

            Err(why) => {
                println!("{}: Failed to read packet: {}", "Error".red().bold(), why.to_string().bright_black().bold());
            }
        }
    }
}
