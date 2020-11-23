import Trie from "../src/trie-prefix-tree/index.js";
function zip(arrays) {
  return arrays[0].map((_, i) => arrays.map((array) => array[i]));
}

let potentialPoints = [];
let wordMultiplier = [];
let potentialZipPoints = [];
let zipWordMultiplier = [];

function push2(point, multi) {
  potentialPoints.push(point);
  wordMultiplier.push(multi);
}
function push2Zip(point, multi) {
  potentialZipPoints.push(point);
  zipWordMultiplier.push(multi);
}
function isHot() {
  $("#passPlay").text("Play");
  $("#swapRecall").text("Recall");
}

function isNot() {
  $("#passPlay").text("Pass");
  $("#swapRecall").text("Swap");
}

function validate(gridState, firstTurn) {
  let { gridLetters: board, gridMultipliers: multiplierMatrix } = gridState;
  try {
    !$(".column .hot").length ? isNot() : isHot();
    if (firstTurn && !board[7][7].letter.trim()) {
      throw "Error: Your word must touch an existing word or the center star";
    }

    let tolerance = firstTurn ? 1 : 2;

    let letter = board.map((row) => row.map((obj) => obj.letter));
    let id = board.map((row) => row.map((obj) => obj.id));
    let hot = board.map((row) => row.map((obj) => obj.hot));
    let pointVal = board.map((row) => row.map((obj) => obj.pointVal));
    let multiplier = multiplierMatrix;

    let fullMatrix = {
      letterRows: letter,
      idRows: id,
      hotRows: hot,
      pointValRows: pointVal,
      multiplierRows: multiplier,
    };

    let fullMatrixZip = {
      letterColumns: zip(letter),
      idColumns: zip(id),
      hotColumns: zip(hot),
      pointValColumns: zip(pointVal),
      multiplierColumns: zip(multiplier),
    };
    console.log(fullMatrix, fullMatrixZip);

    let { letterRows, idRows, hotRows, pointValRows, multiplierRows } = fullMatrix;
    let { letterColumns, idColumns, hotColumns, pointValColumns, multiplierColumns } = fullMatrixZip;

    letterRows = letterRows.map((row) => row.join(""));
    letterColumns = letterColumns.map((column) => column.join(""));

    idRows = idRows.map((row) => row.join(""));
    idColumns = idColumns.map((column) => column.join(""));

    hotRows = hotRows.map((row) => row.join(""));
    hotColumns = hotColumns.map((column) => column.join(""));

    multiplierRows = multiplierRows.map((row) => row.join(""));
    multiplierColumns = multiplierColumns.map((column) => column.join(""));

    pointValRows = pointValRows.map((row) => row.join(""));
    pointValColumns = pointValColumns.map((column) => column.join(""));

    let words = [];
    let ids = [];
    let hotLetters = [];
    let points = [];
    let multipliers = [];

    [...letterRows, ...letterColumns].map((line) =>
      line.split(" ").map((word) => {
        if (word.length > 1) return words.push(word);
      })
    );

    [...idRows, ...idColumns].map((line) =>
      line.split(" ").map((id) => {
        if (ids.includes(id) && id !== board[7][7].id.trim()) {
          throw "(37) The letters you play must lie on the same row or column, and must be connected to each other";
        }
        if (id.length > 0) return ids.push(id);
      })
    );

    [...hotRows, ...hotColumns].map((line) =>
      line.split(" ").map((bool) => {
        if (hotLetters.length > tolerance) {
          console.log(hotLetters);
          throw "(47) The letters you play must lie on the same row or column, and must be connected to each other";
        }
        if (bool.length > 7) return hotLetters.push(bool.replaceAll("false", ""));
      })
    );

    if (ids.length == 2) throw `Word must contain at least two letters`;

    console.log(words);

    words.forEach((word) => {
      if (!Trie().hasWord(word)) throw `The word: '${word}' is INVALID `;
      //check words validity
    });

    potentialPoints = [];
    wordMultiplier = [];
    potentialZipPoints = [];
    zipWordMultiplier = [];
    let coords = [];
    let zipCoords = [];
    fullMatrix.hotRows.forEach((row, rowIndex) => {
      if (_.without(row, " ").length > 1 && row.some((isHot) => isHot === true)) {
        row.forEach((cell, cellIndex) => {
          if (cell !== " ") coords.push([rowIndex, cellIndex]);
        });
      }
    });

    fullMatrixZip.hotColumns.forEach((column, columnIndex) => {
      if (_.without(column, " ").length > 1 && column.some((isHot) => isHot === true)) {
        column.forEach((cell, cellIndex) => {
          if (cell !== " ") zipCoords.push([columnIndex, cellIndex]);
        });
      }
    });

    //prettier-ignore
    coords.forEach(coord => {
      let point = +fullMatrix.pointValRows[coord[0]][coord[1]];
      let multiplier = fullMatrix.multiplierRows[coord[0]][coord[1]];
      multiplier === " " ? potentialPoints.push(point) : 
      multiplier === "dl" ? potentialPoints.push(point * 2) :
      multiplier === "tl" ? potentialPoints.push(point * 3) :
      multiplier === "dw" ? push2(point, 2) :
      multiplier === "tw" ? push2(point, 3) : "";
    });

    //prettier-ignore
    zipCoords.forEach(coord => {
      let point = +fullMatrixZip.pointValColumns[coord[0]][coord[1]];
      let multiplier = fullMatrixZip.multiplierColumns[coord[0]][coord[1]];
      multiplier === " " ? potentialZipPoints.push(point) : 
      multiplier === "dl" ? potentialZipPoints.push(point * 2) :
      multiplier === "tl" ? potentialZipPoints.push(point * 3) :
      multiplier === "dw" ? push2Zip(point, 2) :
      multiplier === "tw" ? push2Zip(point, 3) : "";
    });

    console.log(potentialPoints, wordMultiplier, coords);
    console.log(potentialZipPoints, zipWordMultiplier, zipCoords);

    //TODO: experiment with more words on board
    //TODO: add word totals

    return true;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export default validate;
