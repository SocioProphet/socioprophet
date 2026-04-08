{
  description = "socio-linux workspace controller (devShell stub)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      forAllSystems = f: nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-linux" ] (system: f system);
    in
    {
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
            ];

            shellHook = ''
              echo "[socio-linux] devShell ready: git/jq/yq/python/node" >&2
            '';
          };
        }
      );
    };
}
