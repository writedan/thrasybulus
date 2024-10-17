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
        println!("{}: No such interface: {}", "Error".red().bold(), cli.interface.bright_black().bold());
        std::process::exit(1);
    }

    let interface = interface.unwrap();

    let mut config = datalink::Config::default();
    config.promiscuous = true; // Enable promiscuous mode
    config.read_timeout = None; // Set no timeout

    let (_tx, mut rx) = match datalink::channel(&interface, config) {
        Ok(Channel::Ethernet(tx, rx)) => (tx, rx),

        Ok(_) => {
            println!("{}: Unsupported channel type", "Error".red().bold());
            std::process::exit(2);
        },

        Err(err) => {
            println!("{}: Failed to initialize channel: {}", "Error".red().bold(), err.to_string().bright_black().bold());
            std::process::exit(3);
        }
    };

    println!("Listening on interface: {}", cli.interface.bright_black().bold());

    loop {
        match rx.next() {
            Ok(packet) => {
                let eth_packet = EthernetPacket::new(packet).unwrap();
                if eth_packet.get_ethertype() == EtherType(0x0806) {
                    if let Some(arp_packet) = ArpPacket::new(eth_packet.payload()) {
                        if let pnet::packet::arp::ArpOperation(2) = arp_packet.get_operation() {
                            println!("{} {} is at {} (destination: {})", "ARP REPLY".blue(),arp_packet.get_sender_proto_addr(), arp_packet.get_sender_hw_addr(), arp_packet.get_target_proto_addr());
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
