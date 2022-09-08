const Streamer = require('./streamer');
console.log(process.argv)
const argv = require('minimist')(process.argv.slice(2));
console.log('----')
console.log(argv)
if (!argv.size || !argv.pageAddress || !argv.streamAddress || argv.backup) {
    console.error('Usage: node start.js --size=1280x720 --pageAddress=http://test.com --streamAddress=rtmp://test.com/live');
}
(async() => {
   console.log(' - - - a - ')
	console.log(argv.size)
    console.log(argv);
    let streamer = new Streamer(argv);
    await streamer.init();
    await streamer.start();

    process.on('SIGINT', async () => {
        console.log('Process stopped');
        await streamer.stop();
    });
})();
