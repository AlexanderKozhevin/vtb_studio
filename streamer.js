const puppeteer = require('puppeteer')
const Xvfb = require('xvfb');
const ChildProcess = require("child_process");

function delay(time) {
   return new Promise(function(resolve) { 
       setTimeout(resolve, time)
   }); 
}

const displayNum = 10; 
class Streamer {

    constructor({size, pageAddress, streamAddress, backup} = {backup: null}) {

         size = size.split('x').map(metric => parseInt(metric));
	 console.log(size)

         this.size = size;
         this.pageAddress = pageAddress
         this.streamAddress = streamAddress;
         this.backup = backup;

         this.hasStream = false;
         this.started = false;
    }   

    async init() {
        return new Promise((resolve, reject) => {
            this.xvfb = new Xvfb({
                silent: false,
                displayNum: displayNum,
                reuse: true,
                xvfb_args: ["-nocursor", "-screen", 0, `${this.size[0]}x${this.size[1]}x24+32`, "-ac"],
            }); 
            this.xvfb.start(async (err) => {
                if (err) {
                    console.log('XVFB startup error', err);
                    reject(err);
                } else {
                    try {
                            var args = puppeteer.defaultArgs();
                            console.log('#######################')
                            console.log(args)
                        this.browser = await puppeteer.launch({
                                dumpio: true,
                                ignoreDefaultArgs: ['--mute-audio', '--enable-automation'],
                                executablePath : '/usr/bin/google-chrome-stable',
                            headless: false,
                            args: ['--disable-infobars', '--hide-scrollbars','--no-sandbox', '--start-fullscreen', '--disable-gpu', `--window-size=${this.size[0]},${this.size[1]}`, '--window-position=0,0', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--display=' + this.xvfb._display]
                       }); 
                        this.page = await this.browser.newPage();
                        await this.page.setDefaultNavigationTimeout(0);
                        
                        
                      await this.page.setViewport({width: this.size[0], height: this.size[1]});
                        this.started = true;
                        resolve();
                    } catch (e) {
                        console.log('Puppeteer startup error', e);
                        reject(e);
                    }
                }
            })
        })

    }


    async start() {
      if (this.hasStream) {
         throw new Error('Already started a stream');
     }
     console.log('Starting stream');
     await this.page.goto(this.pageAddress + '&displayName=stream', {
             waitUntil: 'networkidle2'
     });
     const searchButtonNodeSelector = ".join-button";
     //await delay(2000);

     //await this.page.click(searchButtonNodeSelector);

     console.log('Loaded page ' + this.pageAddress);

     this.page.on('console', message => console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
         .on('pageerror', ({message}) => console.log(message))
         .on('response', response => console.log(`${response.status()} ${response.url()}`))
         .on('requestfailed', request => console.log(`${request.failure().errorText} ${request.url()}`))

        let args = [
            '-f', 'pulse',
            '-ac', '2',
            '-i', 'default',
            '-f', 'x11grab',
            '-video_size', `${this.size[0]}x${this.size[1]}`,
            '-draw_mouse', '0',
            '-i', ':' + displayNum,
            '-r', '30',
            '-codec:v', 'libx264',
            '-preset', 'ultrafast',
            '-threads', '0',
            '-crf', '24',
            '-maxrate', '4500k',
            '-bufsize', '4500k',
            '-force_key_frames', 'expr:gte(t,n_forced*2)',
            '-x264opts', 'no-scenecut',
            '-strict', '-2',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-ar', '44100',
            '-g', '60',
            '-pix_fmt', 'yuv420p',
            '-f', 'flv',
             '-flvflags', 'no_duration_filesize',
            this.streamAddress
        ];
        let args2 = [
                  '-r', '30',
            '-codec:v', 'libx264',
            '-preset', 'ultrafast',
            '-threads', '0',
            '-crf', '24',
            '-maxrate', '4500k',
            '-bufsize', '4500k',
            '-force_key_frames', 'expr:gte(t,n_forced*2)',
            '-x264opts', 'no-scenecut',
            '-strict', '-2',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-ar', '44100',
            '-g', '60',
            '-pix_fmt', 'yuv420p',
            '-f', 'flv',
             '-flvflags', 'no_duration_filesize',
            this.backup

        ]
//        if (this.backup){
 //               console.log(this.backup)
  //              args = args.concat(args2)
   //     }
        console.log('FFmpeg args: ');
        console.log(args);

        this.ffmpeg = ChildProcess.spawn('ffmpeg', args);
        this.ffmpeg.stderr.on("data", chunk => {
            chunk.toString()
                .split(/\r?\n/g)
                .filter(Boolean)
                .forEach(line => {
                    console.log(line);
                })
        })
        this.hasStream = true;
    }

    async stop() {
        if (this.hasStream) {
            console.log('Stopping stream');
            //await this.page.goto('about:blank');
            this.ffmpeg.stdin.write('q');
            setTimeout(() => {
                this.ffmpeg.kill("SIGINT");
                this.hasStream = false;
            }, 2500)
        } else {
            throw new Error('Stream not started yet');
        }
    }

    getStatistics() {
        return {
            started: this.started,
            hasStream: this.hasStream,
        }
    }
}

module.exports = Streamer;
                        
