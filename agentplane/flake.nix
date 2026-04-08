{
  description = "agentplane (MIT) — fleet-shaped agent VM bundles + runners";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      forAllSystems = f: nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-linux" ] (system: f system);
    in {
      # Build outputs: NixOS VM artifacts (qemu run script) derived from bundle vm.nix.
      packages = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          mkVM = modulePath:
            (nixpkgs.lib.nixosSystem {
              inherit system;
              modules = [
                modulePath
                # Minimal sane defaults so VM builds are deterministic
                ({ lib, ... }: {
                  system.stateVersion = lib.mkDefault "24.11";
                })
              ];
            }).config.system.build.vm;
        in {
          vm-example-agent = mkVM ./bundles/example-agent/vm.nix;
          default = pkgs.hello;
        }
      );
    };
}
