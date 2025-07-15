{ pkgs, ... }: {
  # https://developers.google.com/idx/guides/customize-idx-env
  channel = "stable-23.11"; # or "unstable"
  packages = [
    pkgs.nodejs_20
    pkgs.stripe-cli
  ];
  previews = {
    enable = true;
    previews = [
      {
        id = "web";
        port = 9002;
        label = "Web";
        manager = "web";
      }
    ];
  };
}
