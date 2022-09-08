FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
RUN set -ex; apt-get update && \
    apt-get install --no-install-recommends -y \
         pulseaudio \
          socat \
          alsa-utils \
          xvfb \
          ffmpeg \
          libgbm-dev \
          curl \
          gnupg \
          wget \
          build-essential \
          ca-certificates && \
          curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
          apt-get -y install --no-install-recommends \
              nodejs \
              libnss3 \
              libxss1 \
              libasound2 \
              libatk-bridge2.0-0 \
              libgtk-3-0 && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | tee /etc/apt/sources.list.d/google-chrome.list && \
    mkdir /test && \
    apt-get update && \
    apt-get install -y --no-install-recommends google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
RUN chmod 0755 /app/start.sh
ENTRYPOINT ["/app/start.sh"]

