// 執行此腳本來產生 tray-icon.png
// node assets/create-icon.js
const fs = require('fs');
const path = require('path');

// 最小的 1x1 透明 PNG (base64)，實際使用時替換成真正圖示
// 這是一個 16x16 的簡單筆記本圖示 (PNG base64)
const ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA30lEQVQ4jc2TMQrCQBCGv00hiIWFjQcQPIAH8Bge0Dt4AA/hKTyAB7CwEBELCw9g4QEsLHIAIbGwkGwhbHaSTbLJv8X8sLPzzc4w8Bd5AjtgCpz9XoEFkAInYAmkwBzIgRyYAUdgB+yBDfAGamAFbIEFUAJHYAoUQAlUQA0sgBpogAZogRaogQ5ogQ5oARtggQ2wwAIbYIEFNsACG2CBBbbAAhtsQA02wAIbbIEFNsACG2yBBTbAAhtsQA02wAIbbIEFNsACG2yBBTbAAhtsQA02wAIbbIEFNsACG2yBBTbA+gLpBz4AAAAASUVORK5CYII=';

const iconPath = path.join(__dirname, 'tray-icon.png');
fs.writeFileSync(iconPath, Buffer.from(ICON_BASE64, 'base64'));
console.log('圖示已建立:', iconPath);
