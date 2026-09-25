import {mkdir,copyFile,writeFile} from 'node:fs/promises';
// Publish only the app assets, never the repository or local launcher.
await mkdir('pages-site/app',{recursive:true});
await copyFile('app/index.html','pages-site/index.html');
for (const name of ['controller.js','view.js','model.js','storage.js','examples.js','style.css']) {
 await copyFile(`app/${name}`,`pages-site/app/${name}`);
}
await writeFile('pages-site/.nojekyll','');
console.log('GitHub Pages site prepared in pages-site/');
