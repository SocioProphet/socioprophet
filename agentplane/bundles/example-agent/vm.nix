{ config, pkgs, lib, ... }:

let
  smokeInner = pkgs.writeShellScript "example-agent-smoke" ''
    set -euo pipefail
    echo "[guest] smoke start: $(date -Iseconds)" >&2

    # Prove mount exists
    if ! mountpoint -q /mnt/artifacts; then
      echo "[guest] ERROR: /mnt/artifacts is not a mountpoint" >&2
      mount >&2 || true
      exit 2
    fi

    # Prove writable
    touch /mnt/artifacts/.writetest || { echo "[guest] ERROR: /mnt/artifacts not writable" >&2; exit 2; }
    rm -f /mnt/artifacts/.writetest

    echo "[guest] hello from example-agent VM" > /mnt/artifacts/guest-console.txt
    echo "[guest] proof: $(date -Iseconds)" > /mnt/artifacts/guest-proof.txt

    cat > /mnt/artifacts/run-artifact.json <<JSON
{
  "kind": "RunArtifact",
  "bundle": "example-agent@0.1.0",
  "lane": "staging",
  "backend": "qemu-local",
  "executedIn": "guest-vm",
  "startedAt": "$(date -Iseconds)",
  "endedAt": "$(date -Iseconds)",
  "result": "pass",
  "environment": {
    "kernel": "$(uname -r)",
    "arch": "$(uname -m)"
  }
}
JSON

    echo "[guest] smoke done: $(date -Iseconds)" >&2
  '';
in
{
  # Make it an appliance: no login prompt
  services.getty.autologinUser = lib.mkForce null;
  systemd.services."getty@ttyAMA0".enable = lib.mkForce false;
  systemd.services."serial-getty@ttyAMA0".enable = lib.mkForce false;

  networking.hostName = "example-agent";

  # Ensure 9p/virtio pieces exist early
  boot.initrd.kernelModules = [ "virtio_pci" "virtio_ring" "9p" "9pnet" "9pnet_virtio" ];
  boot.kernelModules = [ "virtio_pci" "virtio_ring" "9p" "9pnet" "9pnet_virtio" ];

  # Artifacts mount (9p tag "artifacts" provided by QEMU_OPTS)
  fileSystems."/mnt/artifacts" = {
    device = "artifacts";
    fsType = "9p";
    options = [ "trans=virtio" "version=9p2000.L" "msize=104857600" "cache=mmap" ];
  };

  # Run smoke as early as possible after local filesystems
  systemd.services.example-agent-smoke = {
    description = "Example Agent VM Smoke (write artifacts then poweroff)";
    wantedBy = [ "basic.target" ];
    after = [ "local-fs.target" ];
    serviceConfig = {
      Type = "oneshot";
      ExecStart = smokeInner;
      # Always poweroff even if smoke fails
      ExecStartPost = "${pkgs.bash}/bin/bash -lc '${pkgs.systemd}/bin/poweroff || true'";
      StandardOutput = "journal";
      StandardError = "journal";
    };
  };

  environment.systemPackages = [ pkgs.coreutils pkgs.util-linux pkgs.systemd ];
  system.stateVersion = "24.11";
}
