{
  description = "Sociosphere Ecosystem (AgentOS + agentplane)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    # Treat agentplane as a sibling flake, but share nixpkgs.
    agentplane.url = "path:./agentplane";
    agentplane.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, agentplane }:
    let
      forAllSystems = f: nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-linux" ] (system: f system);
    in
    {
      packages = forAllSystems (system: {
        # Re-export the agentplane example VM build.
        vm-example-agent = agentplane.packages.${system}.vm-example-agent;
      });

      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              git
              jq
              yq-go
              python3
              nodejs_20
              bash
              nix
            ];

            shellHook = ''
              echo "[sociosphere] devShell ready" >&2
            '';
          };
        }
      );
    };
}
