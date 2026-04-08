{
  description = "socioprophet workspace controller (agentplane + ops)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    # Pull agentplane from the sibling directory.
    agentplane.url = "path:../../agentplane";
    agentplane.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, agentplane }:
    let
      forAllSystems = f: nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-linux" ] (system: f system);
    in
    {
      packages = forAllSystems (system: {
        vm-example-agent = agentplane.packages.${system}.vm-example-agent;
      });

      devShells = forAllSystems (system:
        let pkgs = import nixpkgs { inherit system; };
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [ git jq python3 nix ];
            shellHook = ''
              echo "[socioprophet] devShell ready: agentplane packages available" >&2
            '';
          };
        }
      );
    };
}
