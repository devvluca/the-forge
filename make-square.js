const Jimp = require('jimp');
const imgPath = 'src/assets/theforge_logo.png';
const outPath = 'src/assets/theforge_logo_square.png';

console.log('Reading image...');
Jimp.read(imgPath).then(img => {
  const max = Math.max(img.bitmap.width, img.bitmap.height);
  console.log('Squaring to ' + max + 'x' + max);
  new Jimp(max, max, '#ffffff00', (err, newImg) => {
    newImg.composite(img, (max - img.bitmap.width) / 2, (max - img.bitmap.height) / 2).write(outPath, () => {
      console.log('Done!');
    });
  });
}).catch(err => {
    console.error(err);
});
