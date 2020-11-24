import Trie from "../src/trie-prefix-tree/index.js";
function zip(arrays) {
  return arrays[0].map((_, i) => arrays.map((array) => array[i]));
}

let rowWordStack = [];
let columnWordStack = [];
let potentialPoints = [];
let wordMultiplier = [];
let potentialZipPoints = [];
let zipWordMultiplier = [];

function push2(point, multi, index) {
  potentialPoints[index].push(point);
  wordMultiplier[index].push(multi);
}
function push2Zip(point, multi, index) {
  potentialZipPoints[index].push(point);
  zipWordMultiplier[index].push(multi);
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
    ); // TODO: fix case in which there is a tile with an id == 10 and ids 1 and 0 are placed together

    [...hotRows, ...hotColumns].map((line) =>
      line.split(" ").map((bool) => {
        if (_.without(hotLetters, "").length > 1 && !hotLetters.some((x) => x === "true")) {
          console.log(hotLetters);
          throw "(47) The letters you play must lie on the same row or column, and must be connected to each other";
        }
        if (bool.length > 7) return hotLetters.push(bool.replaceAll("false", ""));
      })
    );
    console.log(hotLetters);

    if (ids.length == 2) throw `Word must contain at least two letters`;

    console.log(words);

    words.forEach((word) => {
      if (!Trie().hasWord(word)) throw `The word: '${word}' is INVALID `;
      //check words validity
    });

    rowWordStack = [];
    columnWordStack = [];
    potentialPoints = [];
    wordMultiplier = [];
    potentialZipPoints = [];
    zipWordMultiplier = [];
    let coords = [];
    let zipCoords = [];
    let done = false;

    fullMatrix.hotRows.forEach((row, rowIndex) => {
      if (_.without(row, " ").length > 1 && row.some((isHot) => isHot === true)) {
        row.forEach((cell, cellIndex, array) => {
          let first = cellIndex ? 1 : 0;
          if (cell !== " ") {
            if (array[cellIndex - first] === " " && array[cellIndex + 1] === " ") return;
            if (cell === true && array[cellIndex - first] === " ") coords = [];
            let skip = !_.drop(array, cellIndex + 1).some((isHot) => isHot === true);
            if (done) return;
            if (array[cellIndex + 1] === " " && skip) done = true;
            coords.push([rowIndex, cellIndex]);
          }
        });
        done = false;
        if (coords.length > 1) {
          rowWordStack.push(coords);
          coords = [];
        }
      }
    });

    fullMatrixZip.hotColumns.forEach((column, columnIndex) => {
      if (_.without(column, " ").length > 1 && column.some((isHot) => isHot === true)) {
        column.forEach((cell, cellIndex, array) => {
          let first = cellIndex ? 1 : 0;
          if (cell !== " ") {
            if (array[cellIndex - first] === " " && array[cellIndex + 1] === " ") return;
            if (cell === true && array[cellIndex - first] === " ") zipCoords = [];
            let skip = !_.drop(array, cellIndex + 1).some((isHot) => isHot === true);
            if (done) return;
            if (array[cellIndex + 1] === " " && skip) done = true;
            zipCoords.push([columnIndex, cellIndex]);
          }
        });
        done = false;
        if (zipCoords.length > 1) {
          columnWordStack.push(zipCoords);
          zipCoords = [];
        }
      }
    });

    //prettier-ignore
    rowWordStack.forEach((coords, index) => {
      potentialPoints.push([]);
      wordMultiplier.push([]);
      coords.forEach(coord => {
        let point = +fullMatrix.pointValRows[coord[0]][coord[1]];
        let multiplier = fullMatrix.multiplierRows[coord[0]][coord[1]];
        multiplier === " " ? potentialPoints[index].push(point) : 
        multiplier === "dl" ? potentialPoints[index].push(point * 2) :
        multiplier === "tl" ? potentialPoints[index].push(point * 3) :
        multiplier === "dw" ? push2(point, 2, index) :
        multiplier === "tw" ? push2(point, 3, index) : "";
      });
    });

    //prettier-ignore
    columnWordStack.forEach((zipCoords, index) => {
      potentialZipPoints.push([]);
      zipWordMultiplier.push([]);
      zipCoords.forEach(coord => {
        let point = +fullMatrixZip.pointValColumns[coord[0]][coord[1]];
        let multiplier = fullMatrixZip.multiplierColumns[coord[0]][coord[1]];
        multiplier === " " ? potentialZipPoints[index].push(point) : 
        multiplier === "dl" ? potentialZipPoints[index].push(point * 2) :
        multiplier === "tl" ? potentialZipPoints[index].push(point * 3) :
        multiplier === "dw" ? push2Zip(point, 2, index) :
        multiplier === "tw" ? push2Zip(point, 3, index) : "";
      });
    });

    console.log(potentialPoints, wordMultiplier, coords);
    console.log(potentialZipPoints, zipWordMultiplier, zipCoords);

    if (_.without(hotLetters, "").length > potentialPoints.length + potentialZipPoints.length) {
      throw "(57) The letters you play must lie on the same row or column, and must be connected to each other";
    } // TODO: find this problem earlier

    //TODO: experiment with more words on board
    //TODO: add word totals

    return true;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export default validate;
