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

#[derive(Parser)]
#[command(version, about, long_about = None, author = "Daniel Write")]
struct Cli {
    /// Port on which to bind the frontend server.
    #[arg(short, long)]
    port: u32
}

fn verify_installed(program: &str) -> bool {
    match std::process::Command::new(program).arg("--version").output() {
        Ok(output) => output.status.success(),
        Err(err) => false
    }
}

fn load() -> std::path::PathBuf {
    use cmd_lib::run_fun;

    fn mkdir(path: &std::path::Path) -> std::io::Result<()> {
        use std::fs;
        use std::io;
    if !path.exists() {
        fs::create_dir_all(path)?;
    } 

    Ok(())
}

    use directories::ProjectDirs;
    let data_dir = match ProjectDirs::from("", "", "thrasybulus") {
        Some(dirs) => dirs,
        None => {
            println!("Project directory was not available.");
            std::process::exit(2);
        }
    };

    let data_dir = data_dir.data_dir();

    match mkdir(data_dir) {
        Ok(()) => {},
        Err(why) => {
            println!("Failed to create data direction: {}", why);
            std::process::exit(3);
        }
    }

    println!("Data directory is at {:#?}", data_dir);
    if !data_dir.join("git-repo").exists() {
        println!("This appears to be a first-time run. We will clone the repository now.");
        if let Err(why) = run_fun!(
            cd "$data_dir";
            git clone "https://github.com/writedan/thrasybulus" "git-repo";
        ) {
            println!("Fatal error: failed to clone Git respository.");
            std::process::exit(4);
        }
    }

    println!("Pulling updates from Git.");
    if let Err(why) = run_fun!(
        cd "$data_dir";
        cd "git-repo";
        git pull --force --rebase;
    ) {
        println!("Warning: unable to pull updates.");
    }

    println!("Building sniffer.");
    if let Err(why) = run_fun!(
        cd "$data_dir";
        cd "git-repo";
        cd "sniffer";
        cargo build --release;
    ) {
        println!("Fatal error: failed to build sniffer.");
        std::process::exit(5);
    }

    println!("Updating NPM dependencies (first pass).");
    if let Err(why) = run_fun!(
        cd "$data_dir";
        cd "git-repo";
        cd "frontend";
        npm install -y;
    ) {
        println!("Fatal error: failed to build NPM dependencies.");
        std::process::exit(6);
    }

    println!("Load complete.");
    return data_dir.to_path_buf();
}

fn launch_frontend(port: u32, data_dir: &std::path::PathBuf) {
    let data_dir = data_dir.clone();
    std::thread::spawn(move || {
        loop {
            println!("Updating NPM dependencies (second pass).");
            if let Err(why) = cmd_lib::run_fun!(
                cd "$data_dir";
                cd "git-repo";
                cd "frontend";
                npm install -y;
            ) {
                println!("Fatal error: failed to build NPM dependencies.");
                std::process::exit(6);
            }

            match cmd_lib::run_fun!(
                cd "$data_dir";
                cd "git-repo";
                cd "frontend";
                npx expo start --no-dev --minify -p "$port";
            ) {
                _ => {
                    println!("Frontend server terminated, restarting.");
                }
            };
        }
    });
}

fn main() {
    let args = Cli::parse();

    if !verify_installed("cargo") {
        println!("You must have cargo installed to run this application.");
        std::process::exit(1);
    };

    if !verify_installed("git") {
        println!("You must have git installed to run this application.");
        std::process::exit(1);
    };

    if !verify_installed("npm") {
        println!("You must have NPM installed to run this application.");
        std::process::exit(1);
    };

    let data_dir = load();

    launch_frontend(args.port, &data_dir);

    std::thread::spawn(move || {
        rouille::start_server("localhost:9901", move |request| {
            rouille::router!(request,
                (GET) (/interfaces) => {
                    use pnet::datalink::{self};
                    let interfaces = datalink::interfaces();
                    rouille::Response::json(&interfaces)
                },

                (POST) (/interface/IsLive) => {
                    let input = rouille::try_or_400!(rouille::post_input!(request, {
                        interface: String
                    }));
                    rouille::Response::text(format!("{:#?}", input))
                },

                _ => rouille::Response::empty_404()
            )
        });
    });

    println!("Internal server running on http://localhost:9901/");
    println!("Frontend server running on http://0.0.0.0:{}", args.port);

    loop {}
}