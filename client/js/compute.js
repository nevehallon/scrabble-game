import { getWordValues } from "./getRequests.js";
import validate from "./boardValidator.js";
import trie from "../src/trie-prefix-tree/index.js";

window.trie = trie; //! remove from window - used only for debugging

const abc = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
let idCount = 122;

async function calcPcMove(gridState, firstTurn, wordsLogged, rivalRack) {
  let rack = [];
  let pointRack = [];
  let numBlanks = 0;

  rivalRack.forEach((x) => {
    if (!x.letter) numBlanks++;
    rack.push(x.letter);
  });
  rivalRack.forEach((x) => {
    pointRack.push(x.points);
  });

  if (firstTurn) {
    let wordSet = await getWordValues(rack.join("").toLowerCase(), numBlanks);
    if (!wordSet.length) return false;
    let extraCount = 0;
    let candidates = [];
    let wordSlice = wordSet.slice(0, 5);
    let extraIndex = [];

    for (let x = 0; x < wordSlice.length; x++) {
      if (wordSlice[x].word.length > 4 && x < 5) {
        wordSlice.push(wordSlice[x]);
        extraCount++;
      }

      let cleanGrid = _.cloneDeep(gridState);
      let start = 7;

      wordSlice[x].word
        .toUpperCase()
        .split("")
        .forEach((letter, index) => {
          let rackIndex = rack.findIndex((tile) => tile === letter);
          let points = rackIndex === -1 ? 0 : rivalRack[rackIndex].points;

          if (4 < x && x < 4 + extraCount && points > 1 && index > 4) {
            wordSlice.push(wordSlice[x]);
            extraIndex.push(index);
          }

          if (x > 4 + extraCount) {
            let bigIndex = extraIndex[candidates.length - (extraCount + 5)];
            start = bigIndex === 5 ? 6 : 5;
          }

          x < 5 && index === 0 && points > 1 && wordSlice[x].word.length > 4 ? (start = 3) : (start = start);

          cleanGrid.gridLetters[7][start + index].letter = letter;
          cleanGrid.gridLetters[7][start + index].pointVal = points;
          cleanGrid.gridLetters[7][start + index].hot = true;
        });

      let { words, pointTally } = validate(cleanGrid, firstTurn, wordsLogged, false);
      candidates.push({ word: words[0], pointTally, start });
    }

    let bestWord = _.orderBy(candidates, ["pointTally"], ["desc"])[0];

    if (!bestWord) return false;

    let tiles = [];

    bestWord.word.split("").forEach((letter, index) => {
      let rackIndex = rack.findIndex((tile) => tile === letter);
      if (rackIndex === -1) rackIndex = rack.findIndex((tile) => tile === "");

      if (rackIndex > -1) {
        tiles.push(rivalRack[rackIndex]);

        rack.splice(rackIndex, 1);
        rivalRack.splice(rackIndex, 1);

        gridState.gridLetters[7][bestWord.start + index].letter = letter;
        gridState.gridLetters[7][bestWord.start + index].pointVal = tiles[index].points;
        gridState.gridLetters[7][bestWord.start + index].hot = false;
        gridState.gridLetters[7][bestWord.start + index].id = idCount;

        letter = !tiles[index].points ? `font-style: italic;">${letter}` : `">${letter}`;

        $(`[data-location="7,${bestWord.start + index}"]`).append(
          `<div data-drag="${++idCount}" class="tile hot pcPlay ui-draggable ui-draggable-handle" style="z-index: 7; left: 0px; top: 0px; position: relative; font-weight: bolder; font-size: medium; width: 50px; height: 55px;${letter}<div style="bottom: 9px; left: 16px; font-weight: bolder; font-size: 8px;">${
            tiles[index].points
          }</div></div>`
        );
      }
    });
    wordsLogged.push(bestWord.word);
    return { rivalRack: rivalRack, pointTally: bestWord.pointTally, words: wordsLogged, bestWord: bestWord.word };
  } else {
    let startingCoords = {}; //? the cells on the board where we can build off from
    let tilesPlayedCoords = [];
    let tilesPlayed = $("#board .tile").parent().toArray();

    tilesPlayed.forEach((coord) => {
      tilesPlayedCoords.push(coord.getAttribute("data-location").split(",").map(Number));
    });
    let tileCompare = tilesPlayedCoords.map((x) => x.join(""));

    tilesPlayedCoords.forEach((coord) => {
      let locations = [];
      if (!tileCompare.includes([coord[0] - 1, coord[1]].join("")) && coord[0] !== 0)
        locations.push({
          free: coord,
          branch: "up",
        }); // one square up
      if (!tileCompare.includes([coord[0] + 1, coord[1]].join("")) && coord[0] !== 14)
        locations.push({
          free: coord,
          branch: "down",
        }); // one square down
      if (!tileCompare.includes([coord[0], coord[1] - 1].join("")) && coord[1] !== 0)
        locations.push({
          free: coord,
          branch: "left",
        }); // one square left
      if (!tileCompare.includes([coord[0], coord[1] + 1].join("")) && coord[1] !== 14)
        locations.push({
          free: coord,
          branch: "right",
        }); // one square right

      locations.forEach((location) => {
        if (!startingCoords[`${location.free.join("")}`]) {
          startingCoords[`${location.free.join("")}`] = { coord: location.free, branch: [] };
        }

        startingCoords[`${location.free.join("")}`].branch.push(location.branch);
        // }
      });
    });

    let potentialWordsMain = [];

    tilesPlayedCoords.forEach((tile) => {
      if (!startingCoords.hasOwnProperty(tile.join(""))) return;
      let tileInfo = gridState.gridLetters[tile[0]][tile[1]];
      let addLimit = {
        up: tile[0],
        down: 14 - tile[0],
        left: tile[1],
        right: 14 - tile[1],
      };

      let extendPath = (path, isPre) => {
        let potentialBranchMid = [];
        let potentialNewBranchMid = [];
        let potentialBranch2Mid = [];

        let set = isPre ? "prefix" : "suffix";
        let setTally = `${isPre ? "prefix" : "suffix"}Tally`;

        let supply = {};

        supply[set] = [`${tileInfo.letter}`];
        supply[setTally] = [+`${tileInfo.pointVal}`]; //converts to number

        let nextX = tile[0];
        let nextY = tile[1];
        let checkNext = () => {
          //check if and what letters follow in opposite path direction
          path === "up" ? ++nextX : path === "down" ? --nextX : path === "left" ? ++nextY : --nextY;
          let nextCoord;
          if (nextX >= 0 && nextY >= 0 && nextX <= 14 && nextY <= 14) {
            nextCoord = gridState.gridLetters[nextX][nextY];
          }
          if (nextCoord !== undefined && nextCoord.letter !== " ") {
            supply[set].unshift(nextCoord.letter);
            supply[setTally].unshift(+nextCoord.pointVal); //converts to number
            checkNext();
          }
          return;
        };

        checkNext();
        //TODO make sure "nextCoord" is still on by comparing suffix.length + tile[0] !== 14
        let checkedOut = []; //
        let checkedOut4Branch = []; //suffixes that have already been used to insure no repeats
        let checkedOut4NewBranch = []; //
        let level = {
          _0: { newBranch: [] },
          _1: { branch: [], potentialWords: [], potentialPoints: [], branch2: [], newBranch: [] },
          _2: { branch: [], potentialWords: [], potentialPoints: [], branch2: [], newBranch: [] },
          _3: { branch: [], potentialWords: [], potentialPoints: [], branch2: [], newBranch: [] },
          _4: { branch: [], potentialWords: [], potentialPoints: [], branch2: [], newBranch: [] },
          _5: { branch: [], potentialWords: [], potentialPoints: [], branch2: [], newBranch: [] },
          _6: { branch: [], potentialWords: [], potentialPoints: [], branch2: [], newBranch: [] },
          _7: { branch: [], potentialWords: [], potentialPoints: [], branch2: [], newBranch: [] },
        };

        // rivalRack = [...rivalRack.slice(0, 5), { letter: "", points: 0 }, { letter: "", points: 0 }]; //? uncomment to test how long it would take if every turn AI has two blanks

        // gridState.gridLetters[6][5] = { letter: "S", id: "34", pointVal: "taken3", hot: " " }; //? uncomment for debug - checking with interrupting tiles

        nextX = tile[0]; //resetting value
        nextY = tile[1]; //resetting value
        let mod1 = path === "up" || path === "down" ? 1 : 0;
        let mod2 = mod1 ? 0 : 1;
        let borderX = path === "up" ? nextX + 1 : path === "down" ? nextX - 1 : nextX;
        let borderY = path === "left" ? nextY + 1 : path === "right" ? nextY - 1 : nextY;
        let borderCell;
        if (borderX >= 0 && borderY >= 0 && borderX <= 14 && borderY <= 14) {
          borderCell = gridState.gridLetters[borderX][borderY];
        }
        let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
        let boarderLetter = isBordered ? borderCell.letter : "";
        path === "up" ? --nextX : path === "down" ? ++nextX : path === "left" ? --nextY : ++nextY;

        let cellsB4 = "";
        let cellsAfter = "";

        for (let k = 0; k < 12; k++) {
          if (mod1 && k) ++mod1;
          if (mod2 && k) ++mod2;
          if (nextY - mod1 >= 0 && nextX - mod2 >= 0 && nextY - mod1 <= 14 && nextX - mod2 <= 14) {
            cellsB4 += gridState.gridLetters[nextX - mod2][nextY - mod1].letter;
          }
          if (nextY + mod1 <= 14 && nextX + mod2 <= 14 && nextY + mod1 >= 0 && nextX + mod2 >= 0) {
            cellsAfter += gridState.gridLetters[nextX + mod2][nextY + mod1].letter;
          }
        }

        cellsB4 = cellsB4.split(" ")[0].split("").reverse().join("");
        cellsAfter = cellsAfter.split(" ")[0];
        let jokerUsed = false;
        rivalRack.forEach((start, i) => {
          let letter = start.letter;
          let run = () => {
            if (!letter) return;
            let points = start.points;

            let joined = [...supply[set], letter, boarderLetter].join("");
            if (!checkedOut.includes(joined)) {
              let cellsJoined = (cellsB4 + letter + cellsAfter).trim();
              //check if the cells on both side of the new tile make a word together

              if (cellsJoined.length > 1 && !trie().hasWord(cellsJoined)) return;
              if (isPre ? trie().isPrefix(joined) : trie().isSuffix(joined)) {
                checkedOut.push(joined);
                level._1.branch.push({
                  letters: {
                    a: [...supply[set], letter],
                    b: rivalRack.filter((x, index) => index !== i).map((x) => x.letter),
                  },
                  points: {
                    a: [...supply[setTally], points],
                    b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                  },
                  startCoord: [nextX, nextY],
                });
                if (!isPre ? trie().hasWord([...joined].reverse().join("")) : trie().hasWord(joined)) {
                  //setting up 'word tangents'
                  level._1.branch2.push({
                    letters: {
                      a: [letter],
                      b: rivalRack.filter((x, index) => index !== i).map((x) => x.letter),
                    },
                    points: {
                      a: [points],
                      b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                    },
                  });
                }
              }
            }
          };
          run();
          if (!letter && !jokerUsed) {
            abc.forEach((joker) => {
              jokerUsed = true;
              letter = joker;
              run();
            });
          }
        });
        let nextXRotated = nextX;
        let nextYRotated = nextY;
        let nextXRotatedInverse = nextX;
        let nextYRotatedInverse = nextY;
        let count = 0;
        let checkBranchLevel = (prev, cur) => {
          let startingCell;
          let startingCellInverse;
          let branch2StartingCoords;
          let branch2StartingCoordsInverse;
          ++count;
          path === "up" || path === "down" ? --nextYRotated : --nextXRotated;
          path === "up" || path === "down" ? ++nextYRotatedInverse : ++nextXRotatedInverse;
          if (nextXRotated >= 0 && nextYRotated >= 0 && nextXRotated <= 14 && nextYRotated <= 14) {
            startingCell = gridState.gridLetters[nextXRotated][nextYRotated];
            branch2StartingCoords = [nextXRotated, nextYRotated];
          }
          if (
            nextXRotatedInverse >= 0 &&
            nextYRotatedInverse >= 0 &&
            nextXRotatedInverse <= 14 &&
            nextYRotatedInverse <= 14
          ) {
            startingCellInverse = gridState.gridLetters[nextXRotatedInverse][nextYRotatedInverse];
            branch2StartingCoordsInverse = [nextXRotatedInverse, nextYRotatedInverse];
          }
          if (branch2StartingCoords === undefined || branch2StartingCoordsInverse === undefined) {
          }
          let borderCell;
          let borderCellInverse;
          if (path === "up" || path === "down") {
            if (nextYRotated > 0 && nextYRotated < 14 && nextXRotated >= 0 && nextXRotated <= 14) {
              borderCell = gridState.gridLetters[nextXRotated][nextYRotated - 1];
            }
            if (
              nextYRotatedInverse > 0 &&
              nextYRotatedInverse < 14 &&
              nextXRotatedInverse >= 0 &&
              nextXRotatedInverse <= 14
            ) {
              borderCellInverse = gridState.gridLetters[nextXRotatedInverse][nextYRotatedInverse + 1];
            }
          } else {
            if (nextXRotated > 0 && nextXRotated < 14 && nextYRotated >= 0 && nextYRotated <= 14) {
              borderCell = gridState.gridLetters[nextXRotated - 1][nextYRotated];
            }
            if (
              nextXRotatedInverse > 0 &&
              nextXRotatedInverse < 14 &&
              nextYRotatedInverse >= 0 &&
              nextYRotatedInverse <= 14
            ) {
              borderCellInverse = gridState.gridLetters[nextXRotatedInverse + 1][nextYRotatedInverse];
            }
          }
          // }
          mod1 = path === "up" || path === "down" ? 0 : 1;
          mod2 = mod1 ? 0 : 1;
          cellsB4 = "";
          cellsAfter = "";
          let cellsB4Inverse = "";
          let cellsAfterInverse = "";
          for (let k = 0; k < 12; k++) {
            if (mod1 && k) ++mod1;
            if (mod2 && k) ++mod2;

            if (
              nextXRotated - mod2 >= 0 &&
              nextYRotated - mod1 >= 0 &&
              nextXRotated - mod2 <= 14 &&
              nextYRotated - mod1 <= 14
            ) {
              cellsB4 += gridState.gridLetters[nextXRotated - mod2][nextYRotated - mod1].letter;
            }
            if (
              nextXRotatedInverse - mod2 >= 0 &&
              nextYRotatedInverse - mod1 >= 0 &&
              nextXRotatedInverse - mod2 <= 14 &&
              nextYRotatedInverse - mod1 <= 14
            ) {
              cellsB4Inverse += gridState.gridLetters[nextXRotatedInverse - mod2][nextYRotatedInverse - mod1].letter;
            }

            if (
              nextXRotated + mod2 <= 14 &&
              nextYRotated + mod1 <= 14 &&
              nextXRotated + mod2 >= 0 &&
              nextYRotated + mod1 >= 0
            ) {
              cellsAfter += gridState.gridLetters[nextXRotated + mod2][nextYRotated + mod1].letter;
            }
            if (
              nextXRotatedInverse + mod2 <= 14 &&
              nextYRotatedInverse + mod1 <= 14 &&
              nextXRotatedInverse + mod2 >= 0 &&
              nextYRotatedInverse + mod1 >= 0
            ) {
              cellsAfterInverse += gridState.gridLetters[nextXRotatedInverse + mod2][nextYRotatedInverse + mod1].letter;
            }
          }

          cellsB4 = cellsB4.split(" ")[0].split("").reverse().join("");
          cellsB4Inverse = cellsB4Inverse.split(" ")[0].split("").reverse().join("");
          cellsAfter = cellsAfter.split(" ")[0];
          cellsAfterInverse = cellsAfterInverse.split(" ")[0];

          prev.forEach((start, i) => {
            jokerUsed = false;
            let joker2Used = false;
            let joker3Used = false;

            start.letters.b.forEach((letter, i2) => {
              let run = () => {
                let temp1 = { letters: [], points: [], details: [] };
                let temp2 = { letters: [], points: [], details: [] };
                if (!letter) return;
                let originalLetter = letter;
                let points = prev[i].points.b[i2];
                //!  1.0
                let taken = false;
                if (count === 1 || prev[i]?.details?.type === 1 || prev[i]?.details?.type === 3) {
                  if (startingCell !== undefined && startingCell.letter !== " ") {
                    letter = startingCell.letter;
                    points = +startingCell.pointVal;
                    taken = true;
                  }
                  let cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                  if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                    let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
                    let boarderLetter = isBordered ? borderCell.letter : "";
                    let joined = [boarderLetter, letter, ...start.letters.a].join("");
                    if (!checkedOut4Branch.includes(joined)) {
                      if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                        if (startingCell !== undefined) {
                          checkedOut4Branch.push(joined); //?
                          temp1.letters.push({
                            a: [letter, ...start.letters.a],
                            b: start.letters.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp1.points.push({
                            a: [points, ...prev[i].points.a],
                            b: prev[i].points.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp1.details.push({ coords: branch2StartingCoords, isEnd: false, type: 1 });
                        }
                        //!1.1
                        if (
                          ((temp1.letters[0]?.b?.length && count === 1) ||
                            (temp1.letters[0]?.b?.length && prev[i]?.details?.type === 3)) &&
                          startingCellInverse !== undefined
                        ) {
                          let run4Type3 = () => {
                            let taken = false;
                            letter = temp1.letters[0].b[0];
                            points = temp1.points[0].b[0];
                            if (!letter) return;
                            if (startingCellInverse !== undefined && startingCellInverse.letter !== " ") {
                              letter = startingCellInverse.letter;
                              points = +startingCellInverse.pointVal;
                              taken = true;
                            }
                            cellsJoined = (cellsB4Inverse + letter + cellsAfter).trim();
                            if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                              let isBordered =
                                borderCellInverse !== undefined && borderCellInverse.letter !== " " ? true : false;
                              let boarderLetter = isBordered ? borderCellInverse.letter : "";
                              let joined = [...temp1.letters[0].a, letter, boarderLetter].join("");
                              if (!checkedOut4Branch.includes(joined)) {
                                if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                                  checkedOut4Branch.push(joined); //?
                                  temp1.letters.unshift({
                                    a: [...temp1.letters[0].a, letter],
                                    b: temp1.letters[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp1.points.unshift({
                                    a: [...temp1.points[0].a, points],
                                    b: temp1.points[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp1.details.unshift({
                                    coords: branch2StartingCoordsInverse,
                                    isEnd: true,
                                    type: 3,
                                  });
                                }
                              }
                            }
                          };
                          run4Type3();
                          if (!letter && !joker2Used) {
                            joker2Used = true;
                            abc.forEach((joker) => {
                              letter = joker;
                              run4Type3();
                            });
                          }
                        }
                      }
                    }
                  }
                }
                if (count === 1 || prev[i]?.details?.type === 2 || prev[i]?.details?.type === 3) {
                  letter = originalLetter;
                  points = prev[i].points.b[i2];
                  let taken = false;
                  //!    2.0
                  if (startingCellInverse !== undefined && startingCellInverse.letter !== " ") {
                    letter = startingCellInverse.letter;
                    points = +startingCellInverse.pointVal;
                    taken = true;
                  }
                  let cellsJoined = (cellsB4Inverse + letter + cellsAfter).trim();
                  if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                    let isBordered = borderCellInverse !== undefined && borderCellInverse.letter !== " " ? true : false;
                    let boarderLetter = isBordered ? borderCellInverse.letter : "";
                    let joined = [...start.letters.a, letter, boarderLetter].join("");
                    if (!checkedOut4Branch.includes(joined)) {
                      if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                        if (startingCellInverse !== undefined) {
                          checkedOut4Branch.push(joined); //?
                          temp2.letters.unshift({
                            a: [...start.letters.a, letter],
                            b: start.letters.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp2.points.unshift({
                            a: [...prev[i].points.a, points],
                            b: prev[i].points.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp2.details.push({
                            coords: branch2StartingCoordsInverse,
                            isEnd: true,
                            type: 2,
                          });
                        }
                        //!  2.1
                        if (
                          ((temp2.letters[0]?.b?.length && count === 1) ||
                            (temp2.letters[0]?.b?.length && prev[i]?.details?.type === 3)) &&
                          startingCell !== undefined
                        ) {
                          let run4Type3_2 = () => {
                            let taken = false;
                            letter = temp2.letters[0].b[0];
                            points = temp2.points[0].b[0];
                            if (!letter) return; //!check if start.a has already been used with a blank
                            if (startingCell !== undefined && startingCell.letter !== " ") {
                              letter = startingCell.letter;
                              points = +startingCell.pointVal;
                              taken = true;
                            }
                            cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                            if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                              let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
                              let boarderLetter = isBordered ? borderCell.letter : "";
                              let joined = [boarderLetter, letter, ...temp2.letters[0].a].join("");
                              if (!checkedOut4Branch.includes(joined)) {
                                if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                                  checkedOut4Branch.push(joined); //?
                                  temp2.letters.unshift({
                                    a: [letter, ...temp2.letters[0].a],
                                    b: temp2.letters[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp2.points.unshift({
                                    a: [points, ...temp2.points[0].a],
                                    b: temp2.points[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp2.details.unshift({
                                    coords: branch2StartingCoords,
                                    isEnd: true,
                                    type: 3,
                                  });
                                }
                              }
                            }
                          };
                          run4Type3_2();
                          if (!letter && !joker3Used) {
                            joker3Used = true;
                            abc.forEach((joker) => {
                              letter = joker;
                              run4Type3_2();
                            });
                          }
                        }
                      }
                    }
                  }
                }
                temp1.letters.forEach((x, i) => {
                  cur.unshift({
                    letters: x,
                    points: temp1.points[i],
                    details: temp1.details[i],
                    score: _.sum(temp1.points[i].a),
                    length: 7 - x.b.length,
                  });
                });
                temp2.letters.forEach((x, i) => {
                  cur.unshift({
                    letters: x,
                    points: temp2.points[i],
                    details: temp2.details[i],
                    score: _.sum(temp2.points[i].a),
                    length: 7 - x.b.length,
                  });
                });
              };
              run();
              if (!letter && !jokerUsed) {
                jokerUsed = true;
                abc.forEach((joker) => {
                  letter = joker;
                  run();
                });
              }
            });
          });
        };

        let nextNewXRotated = tile[0];
        let nextNewYRotated = tile[1];
        let nextNewXRotatedInverse = tile[0];
        let nextNewYRotatedInverse = tile[1];
        count = 0;
        let checkNewBranchLevel = (prev, cur) => {
          let startingCell = undefined;
          let startingCellInverse = undefined;
          let newBranchStartingCoords = undefined;
          let newBranchStartingCoordsInverse = undefined;
          ++count;
          path === "up" || path === "down" ? --nextNewXRotated : --nextNewYRotated;
          path === "up" || path === "down" ? ++nextNewXRotatedInverse : ++nextNewYRotatedInverse;
          if (nextNewXRotated >= 0 && nextNewYRotated >= 0 && nextNewXRotated <= 14 && nextNewYRotated <= 14) {
            startingCell = gridState.gridLetters[nextNewXRotated][nextNewYRotated];
            newBranchStartingCoords = [nextNewXRotated, nextNewYRotated];
          }
          if (
            nextNewXRotatedInverse >= 0 &&
            nextNewYRotatedInverse >= 0 &&
            nextNewXRotatedInverse <= 14 &&
            nextNewYRotatedInverse <= 14
          ) {
            startingCellInverse = gridState.gridLetters[nextNewXRotatedInverse][nextNewYRotatedInverse];
            newBranchStartingCoordsInverse = [nextNewXRotatedInverse, nextNewYRotatedInverse];
          }
          let borderCell;
          let borderCellInverse;
          if (path === "up" || path === "down") {
            if (nextNewXRotated > 0 && nextNewXRotated < 14 && nextNewYRotated >= 0 && nextNewYRotated <= 14) {
              borderCell = gridState.gridLetters[nextNewXRotated - 1][nextNewYRotated];
            }
            if (
              nextNewXRotatedInverse > 0 &&
              nextNewXRotatedInverse < 14 &&
              nextNewYRotatedInverse >= 0 &&
              nextNewYRotatedInverse <= 14
            ) {
              borderCellInverse = gridState.gridLetters[nextNewXRotatedInverse + 1][nextNewYRotatedInverse];
            }
          } else {
            if (nextNewYRotated > 0 && nextNewYRotated < 14 && nextNewXRotated >= 0 && nextNewXRotated <= 14) {
              borderCell = gridState.gridLetters[nextNewXRotated][nextNewYRotated - 1];
            }
            if (
              nextNewYRotatedInverse > 0 &&
              nextNewYRotatedInverse < 14 &&
              nextNewXRotatedInverse >= 0 &&
              nextNewXRotatedInverse <= 14
            ) {
              borderCellInverse = gridState.gridLetters[nextNewXRotatedInverse][nextNewYRotatedInverse + 1];
            }
          }
          // }
          mod1 = path === "up" || path === "down" ? 1 : 0;
          mod2 = mod1 ? 0 : 1;

          cellsB4 = "";
          cellsAfter = "";
          let cellsB4Inverse = "";
          let cellsAfterInverse = "";
          for (let k = 0; k < 12; k++) {
            if (mod1 && k) ++mod1;
            if (mod2 && k) ++mod2;

            if (
              nextNewXRotated - mod2 >= 0 &&
              nextNewYRotated - mod1 >= 0 &&
              nextNewXRotated - mod2 <= 14 &&
              nextNewYRotated - mod1 <= 14
            ) {
              cellsB4 += gridState.gridLetters[nextNewXRotated - mod2][nextNewYRotated - mod1].letter;
            }
            if (
              nextNewXRotatedInverse - mod2 >= 0 &&
              nextNewYRotatedInverse - mod1 >= 0 &&
              nextNewXRotatedInverse - mod2 <= 14 &&
              nextNewYRotatedInverse - mod1 <= 14
            ) {
              cellsB4Inverse +=
                gridState.gridLetters[nextNewXRotatedInverse - mod2][nextNewYRotatedInverse - mod1].letter;
            }

            if (
              nextNewXRotated + mod2 <= 14 &&
              nextNewYRotated + mod1 <= 14 &&
              nextNewXRotated + mod2 >= 0 &&
              nextNewYRotated + mod1 >= 0
            ) {
              cellsAfter += gridState.gridLetters[nextNewXRotated + mod2][nextNewYRotated + mod1].letter;
            }
            if (
              nextNewXRotatedInverse + mod2 <= 14 &&
              nextNewYRotatedInverse + mod1 <= 14 &&
              nextNewXRotatedInverse + mod2 >= 0 &&
              nextNewYRotatedInverse + mod1 >= 0
            ) {
              cellsAfterInverse +=
                gridState.gridLetters[nextNewXRotatedInverse + mod2][nextNewYRotatedInverse + mod1].letter;
            }
          }

          cellsB4 = cellsB4.split(" ")[0].split("").reverse().join("");
          cellsB4Inverse = cellsB4Inverse.split(" ")[0].split("").reverse().join("");
          cellsAfter = cellsAfter.split(" ")[0];
          cellsAfterInverse = cellsAfterInverse.split(" ")[0];

          prev.forEach((start, i) => {
            jokerUsed = false;
            let joker2Used = false;
            let joker3Used = false;

            start.letters.b.forEach((letter, i2) => {
              let run = () => {
                let temp1 = { letters: [], points: [], details: [] };
                let temp2 = { letters: [], points: [], details: [] };
                if (!letter) return; //!check if start.a has already been used with a blank
                let originalLetter = letter;
                let points = prev[i].points.b[i2];
                //!  1.0
                let taken = false;
                if (count === 1 || prev[i]?.details?.type === 1 || prev[i]?.details?.type === 3) {
                  if (startingCell !== undefined && startingCell.letter !== " ") {
                    letter = startingCell.letter;
                    points = +startingCell.pointVal; //?string number value (can help determine which cells are taken)
                    taken = true;
                  }
                  let cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                  if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                    let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
                    let boarderLetter = isBordered ? borderCell.letter : "";
                    let joined = [boarderLetter, letter, ...start.letters.a].join("");
                    if (!checkedOut4NewBranch.includes(joined)) {
                      //?^^move to else condition without "!"^^?
                      if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                        if (startingCell !== undefined) {
                          checkedOut4NewBranch.push(joined); //?
                          temp1.letters.push({
                            a: [letter, ...start.letters.a],
                            b: start.letters.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp1.points.push({
                            a: [points, ...prev[i].points.a],
                            b: prev[i].points.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp1.details.push({ coords: newBranchStartingCoords, isEnd: false, type: 1 });
                        }
                        //!1.1
                        if (
                          ((temp1.letters[0]?.b?.length && count === 1) ||
                            (temp1.letters[0]?.b?.length && prev[i]?.details?.type === 3)) &&
                          startingCellInverse !== undefined
                        ) {
                          let run4Type3 = () => {
                            let taken = false;
                            letter = temp1.letters[0].b[0];
                            points = temp1.points[0].b[0];
                            if (!letter) return; //!check if start.a has already been used with a blank
                            if (startingCellInverse !== undefined && startingCellInverse.letter !== " ") {
                              letter = startingCellInverse.letter;
                              points = +startingCellInverse.pointVal;
                              taken = true;
                            }
                            cellsJoined = (cellsB4Inverse + letter + cellsAfter).trim();
                            if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                              let isBordered =
                                borderCellInverse !== undefined && borderCellInverse.letter !== " " ? true : false;
                              let boarderLetter = isBordered ? borderCellInverse.letter : "";
                              let joined = [...temp1.letters[0].a, letter, boarderLetter].join("");
                              if (!checkedOut4NewBranch.includes(joined)) {
                                if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                                  checkedOut4NewBranch.push(joined); //?
                                  temp1.letters.unshift({
                                    a: [...temp1.letters[0].a, letter],
                                    b: temp1.letters[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp1.points.unshift({
                                    a: [...temp1.points[0].a, points],
                                    b: temp1.points[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp1.details.unshift({
                                    coords: newBranchStartingCoordsInverse,
                                    isEnd: true,
                                    type: 3,
                                  });
                                }
                              }
                            }
                          };
                          run4Type3();
                          if (!letter && !joker2Used) {
                            joker2Used = true;
                            abc.forEach((joker) => {
                              letter = joker;
                              run4Type3();
                            });
                          }
                        }
                      }
                    }
                  }
                }
                if (count === 1 || prev[i]?.details?.type === 2 || prev[i]?.details?.type === 3) {
                  letter = originalLetter;
                  points = prev[i].points.b[i2];
                  let taken = false;
                  //!    2.0
                  if (startingCellInverse !== undefined && startingCellInverse.letter !== " ") {
                    letter = startingCellInverse.letter;
                    points = +startingCellInverse.pointVal;
                    taken = true;
                  }
                  let cellsJoined = (cellsB4Inverse + letter + cellsAfter).trim();
                  if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                    let isBordered = borderCellInverse !== undefined && borderCellInverse.letter !== " " ? true : false;
                    let boarderLetter = isBordered ? borderCellInverse.letter : "";
                    let joined = [...start.letters.a, letter, boarderLetter].join("");
                    if (!checkedOut4NewBranch.includes(joined)) {
                      //?^^move to else condition without "!"^^?
                      if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                        if (startingCellInverse !== undefined) {
                          checkedOut4NewBranch.push(joined); //?
                          temp2.letters.unshift({
                            a: [...start.letters.a, letter],
                            b: start.letters.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp2.points.unshift({
                            a: [...prev[i].points.a, points],
                            b: prev[i].points.b.filter((x, index) => index !== (taken ? 8 : i2)),
                          });
                          temp2.details.push({
                            coords: newBranchStartingCoordsInverse,
                            isEnd: true,
                            type: 2,
                          });
                        }
                        //!  2.1
                        if (
                          ((temp2.letters[0]?.b?.length && count === 1) ||
                            (temp2.letters[0]?.b?.length && prev[i]?.details?.type === 3)) &&
                          startingCell !== undefined
                        ) {
                          let run4Type3_2 = () => {
                            let taken = false;
                            letter = temp2.letters[0].b[0];
                            points = temp2.points[0].b[0];
                            if (!letter) return; //!check if start.a has already been used with a blank
                            if (startingCell !== undefined && startingCell.letter !== " ") {
                              letter = startingCell.letter;
                              points = +startingCell.pointVal;
                              taken = true;
                            }
                            cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                            if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                              let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
                              let boarderLetter = isBordered ? borderCell.letter : "";
                              let joined = [boarderLetter, letter, ...temp2.letters[0].a].join("");
                              if (!checkedOut4NewBranch.includes(joined)) {
                                if (trie().isSuffix(joined.split("").reverse().join("")) || trie().isPrefix(joined)) {
                                  checkedOut4NewBranch.push(joined); //?
                                  temp2.letters.unshift({
                                    a: [letter, ...temp2.letters[0].a],
                                    b: temp2.letters[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp2.points.unshift({
                                    a: [points, ...temp2.points[0].a],
                                    b: temp2.points[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp2.details.unshift({
                                    coords: newBranchStartingCoords,
                                    isEnd: true,
                                    type: 3,
                                  });
                                }
                              }
                            }
                          };
                          run4Type3_2();
                          if (!letter && !joker3Used) {
                            joker3Used = true;
                            abc.forEach((joker) => {
                              letter = joker;
                              run4Type3_2();
                            });
                          }
                        }
                      }
                    }
                  }
                }
                temp1.letters.forEach((x, i) => {
                  cur.unshift({
                    letters: x,
                    points: temp1.points[i],
                    details: temp1.details[i],
                    score: _.sum(temp1.points[i].a),
                    length: 7 - x.b.length,
                  });
                });
                temp2.letters.forEach((x, i) => {
                  cur.unshift({
                    letters: x,
                    points: temp2.points[i],
                    details: temp2.details[i],
                    score: _.sum(temp2.points[i].a),
                    length: 7 - x.b.length,
                  });
                });
              };
              run();
              if (!letter && !jokerUsed) {
                jokerUsed = true;
                abc.forEach((joker) => {
                  letter = joker;
                  run();
                });
              }
            });
          });
        };

        let nextCellInfo;

        let borderCellInfo;
        let borderLetterInverse = boarderLetter;

        let checkLevel = (prev, cur) => {
          path === "up" ? --nextX : path === "down" ? ++nextX : path === "left" ? --nextY : ++nextY;

          cellsB4 = "";
          cellsAfter = "";
          mod1 = path === "up" || path === "down" ? 1 : 0;
          mod2 = mod1 ? 0 : 1;

          for (let k = 0; k < 12; k++) {
            if (mod1 && k) ++mod1;
            if (mod2 && k) ++mod2;

            if (nextY - mod1 >= 0 && nextX - mod2 >= 0) {
              cellsB4 += gridState.gridLetters[nextX - mod2][nextY - mod1].letter;
            }
            if (nextY + mod1 <= 14 && nextX + mod2 <= 14) {
              cellsAfter += gridState.gridLetters[nextX + mod2][nextY + mod1].letter;
            }
          }

          cellsB4 = cellsB4.split(" ")[0].split("").reverse().join("");
          cellsAfter = cellsAfter.split(" ")[0];

          prev.forEach((start, i) => {
            jokerUsed = false;
            start.letters.b.forEach((letter, i2) => {
              let run = () => {
                if (!letter) return;
                let taken = false;
                let points = prev[i].points.b[i2];
                if (nextCellInfo !== undefined && nextCellInfo.letter !== " ") {
                  letter = nextCellInfo.letter;
                  points = +nextCellInfo.pointVal;
                  taken = true;
                } else {
                  let cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                  if (cellsJoined.length > 1 && !trie().hasWord(cellsJoined)) return;
                }
                let isBordered = borderCellInfo && borderCellInfo.letter !== " " ? true : false;
                let boarderLetter = isBordered ? borderCellInfo.letter : "";
                let joined = [...start.letters.a, letter, boarderLetter].join("");

                if (!checkedOut.includes(joined)) {
                  if (isPre ? trie().isPrefix(joined) : trie().isSuffix(joined)) {
                    checkedOut.push(joined);
                    cur.push({
                      letters: {
                        a: [...start.letters.a, letter],
                        b: start.letters.b.filter((x, index) => index !== (taken ? 8 : i2)),
                      },
                      points: {
                        a: [...prev[i].points.a, points],
                        b: prev[i].points.b.filter((x, index) => index !== (taken ? 8 : i2)),
                      },
                      startCoord: [nextX, nextY],
                    });
                  }
                }
              };
              run();
              if (!letter && !jokerUsed) {
                abc.forEach((joker) => {
                  jokerUsed = true;
                  letter = joker;
                  run();
                });
              }
            });
          });
        };
        // gridState.gridLetters[1][7] = { letter: "E", id: "34", pointVal: "taken3", hot: " " }; //? uncomment to debug - checking with interrupting tiles

        // if there is a suffix then repeat until there is no suffix || no more tiles to add || can't make longer
        level._0.newBranch.push({
          letters: {
            a: [gridState.gridLetters[tile[0]][tile[1]].letter],
            b: rack,
          },
          points: {
            a: [+gridState.gridLetters[tile[0]][tile[1]].pointVal],
            b: pointRack,
          },
        });
        checkNewBranchLevel(level._0.newBranch, level._1.newBranch);
        if (level[`_1`].newBranch.length) {
          potentialNewBranchMid.unshift(...level[`_1`].newBranch);
        }
        if (level[`_1`].branch.length) {
          potentialBranchMid.unshift(...level[`_1`].branch);
        }

        if (rivalRack.length > 1) {
          //? if rack has only 1 tile then it should have already been used
          for (let j = 1; j < rivalRack.length; j++) {
            // if (level !== undefined && level[`_${j}`] !== undefined && level[`_${j + 1}`] !== undefined) {
            if (level[`_${j}`].branch2.length && j + 1 <= 7) {
              checkBranchLevel(level[`_${j}`].branch2, level[`_${j + 1}`].branch2);
              potentialBranch2Mid.unshift(...level[`_${j + 1}`].branch2);
            }

            if (level[`_${j}`].newBranch.length && j + 1 <= 7) {
              checkNewBranchLevel(level[`_${j}`].newBranch, level[`_${j + 1}`].newBranch);
              potentialNewBranchMid.unshift(...level[`_${j + 1}`].newBranch);
            }
            if (j + 1 <= addLimit[`${path}`] && level[`_${j}`].branch.length && j + 1 <= 7) {
              // prettier-ignore
              let x = path === "up" ? tile[0] - (j + 1) : path === "down" ? tile[0] + (j + 1) : tile[0];
              let y = path === "left" ? tile[1] - (j + 1) : path === "right" ? tile[1] + (j + 1) : tile[1];

              nextCellInfo = gridState.gridLetters[x][y];
              if (x < 13 && x > 1 && y < 13 && y > 1) {
                if (x < 13 && x > 1)
                  x = path === "up" ? tile[0] - (j + 2) : path === "down" ? tile[0] + (j + 2) : tile[0];
                if (y < 13 && y > 1)
                  y = path === "left" ? tile[1] - (j + 2) : path === "right" ? tile[1] + (j + 2) : tile[1];
                borderCellInfo = gridState.gridLetters[x][y];
              } else {
                borderCellInfo = false;
              }
              checkLevel(level[`_${j}`].branch, level[`_${j + 1}`].branch);

              potentialBranchMid.unshift(...level[`_${j + 1}`].branch);
            }
            // } else {
            // throw { level, _j: level[`_${j}`], _j1: level[`_${j + 1}`] };
            // }
          }
        }
        // check starting from the longest suffix -> if word -> put words in "main" array with path

        let sliceNum = potentialBranchMid.slice().length;
        // let sliceNum = potentialBranchMid.slice(0, 222).length;//? uncomment for reduced word options (potentially speeding up AI's moves)

        for (let i = 0; i < sliceNum; i++) {
          if (potentialBranchMid.length >= sliceNum) {
            let word = potentialBranchMid[i].letters;
            let setWord = isPre ? word.a : word.a.reverse();
            let setPoints = isPre ? potentialBranchMid[i].points.a : potentialBranchMid[i].points.a.reverse();

            if (trie().hasWord(borderLetterInverse.concat(setWord.join("")))) {
              potentialWordsMain.push({
                numHotTiles: rivalRack.length - word.b.length,
                remaining: word.b.map((x, index) => {
                  return { letter: x, points: potentialBranchMid[i].points.b[index] };
                }),
                startCoord: potentialBranchMid[i].startCoord,
                word: setWord,
                joined: setWord.join(""),
                points: setPoints,
                score: _.sum(setPoints),
                path,
                reverseOrder: isPre ? true : false,
              });
            } else {
              // sliceNum++; //?enable if we go back to the slice method
            }
          }
        }
        sliceNum = potentialBranch2Mid.slice().length;
        for (let i = 0; i < sliceNum; i++) {
          if (potentialBranch2Mid.length >= sliceNum) {
            let word = potentialBranch2Mid[i].letters;
            let setWord = word.a;
            let setPoints = potentialBranch2Mid[i].points.a;

            if (trie().hasWord(setWord.join("")) || trie().hasWord(setWord.reverse().join(""))) {
              potentialWordsMain.push({
                a_set: supply[set].join(""),
                numHotTiles: rivalRack.length - word.b.length,
                remaining: word.b.map((x, index) => {
                  return { letter: x, points: potentialBranch2Mid[i].points.b[index] };
                }),
                startCoord: potentialBranch2Mid[i].details.coords,
                word: setWord,
                joined: setWord.join(""),
                points: setPoints,
                score: _.sum(setPoints),
                path,
                a_branch2: true,
                a_isEnd: potentialBranch2Mid[i].details.isEnd,
                reverseOrder: potentialBranch2Mid[i].details.isEnd ? true : false,
              });
            } else {
              // sliceNum++; //?enable if we go back to the slice method
            }
          }
        }
        potentialNewBranchMid = potentialNewBranchMid.filter((x) => rivalRack.length - x.letters.b.length !== 0);
        sliceNum = potentialNewBranchMid.slice().length;
        // sliceNum = potentialNewBranchMid.slice(0, 222).length; //? uncomment for reduced word options (potentially speeding up AI's moves)
        for (let i = 0; i < sliceNum; i++) {
          if (potentialNewBranchMid.length >= sliceNum) {
            let word = potentialNewBranchMid[i].letters;
            let setWord = word.a;
            let setPoints = potentialNewBranchMid[i].points.a;
            if (trie().hasWord(setWord.join("")) || trie().hasWord(setWord.reverse().join(""))) {
              potentialWordsMain.push({
                a_joined: setWord.join(""), //TODO: get rid of prop
                set: supply[set].join(""),
                numHotTiles: rivalRack.length - word.b.length,
                remaining: word.b.map((x, index) => {
                  return { letter: x, points: potentialNewBranchMid[i].points.b[index] };
                }),
                startCoord: potentialNewBranchMid[i].details.coords,
                word: setWord,
                joined: setWord.join(""),
                points: setPoints,
                score: _.sum(setPoints),
                path,
                reverseOrder: potentialNewBranchMid[i].details.isEnd ? true : false,
              });
            } else {
              // sliceNum++;//?enable if we go back to the slice method
            }
          }
        }
      };
      startingCoords[`${tile.join("")}`].branch.forEach((path) => {
        if (path === "up") {
          extendPath(path, false); //?parameters ==> (path: string, isPrefix: boolean)
        }

        if (path === "down") {
          extendPath(path, true);
        }
        if (path === "left") {
          extendPath(path, false);
        }
        if (path === "right") {
          extendPath(path, true);
        }
      });

      //? iterate over main words => place on board => validate() && get Score => rank descending pick best =>render
    });
    if (!potentialWordsMain.length) {
    }
    let bingos = potentialWordsMain.filter((x) => x.numHotTiles === 7);
    let notBingos = potentialWordsMain.filter((x) => x.numHotTiles !== 7);
    notBingos = _.orderBy(notBingos, ["score"], ["desc"]);
    bingos = _.orderBy(bingos, ["score"], ["desc"]);
    let candidates = [...bingos, ...notBingos];
    if (!candidates.length) {
      return false;
    }
    // let extraCount = 0;
    let wordSlice = candidates.slice();
    // let wordSlice = candidates.slice(0, 222); //? uncomment for reduced word options (potentially speeding up AI's moves)

    candidates = [];
    wordSlice.forEach((item, index) => {
      let badCookie = false;
      let choice = wordSlice[index];
      let cleanGrid = _.cloneDeep(gridState);
      let start = choice.startCoord;
      let gridOrder = [];
      if (choice.reverseOrder) {
        choice.word = choice.word.reverse();
        choice.points = choice.points.reverse();
      }
      choice.word.forEach((letter, i) => {
        let x;
        let y;

        if (!choice.hasOwnProperty("a_branch2")) {
          if (choice.path === "up") {
            x = choice.reverseOrder ? i * -1 : i;
            y = 0;
          }
          if (choice.path === "down") {
            x = choice.reverseOrder ? i * -1 : i;
            y = 0;
          }
          if (choice.path === "left") {
            x = 0;
            y = choice.reverseOrder ? i * -1 : i;
          }
          if (choice.path === "right") {
            x = 0;
            y = choice.reverseOrder ? i * -1 : i;
          }
        } else {
          if (choice.path === "up" || choice.path === "down") {
            if (choice.a_isEnd) {
              x = 0;
              y = i * -1;
            } else {
              x = 0;
              y = i;
            }
          } else {
            if (choice.a_isEnd) {
              x = i * -1;
              y = 0;
            } else {
              x = i;
              y = 0;
            }
          }
        }
        if (start === undefined) {
        }
        if (start[0] + x < 0 || start[1] + y < 0 || start[0] + x > 14 || start[1] + y > 14) {
          badCookie = true;
          return;
        }
        let isHot = true;
        if (cleanGrid.gridLetters[start[0] + x][start[1] + y].hot === false) {
          isHot = false;
        }
        if (cleanGrid.gridLetters[start[0] + x][start[1] + y].letter === " ") {
          cleanGrid.gridLetters[start[0] + x][start[1] + y].letter = letter;
          cleanGrid.gridLetters[start[0] + x][start[1] + y].pointVal = choice.points[i];
          cleanGrid.gridLetters[start[0] + x][start[1] + y].id = ++idCount;
          cleanGrid.gridLetters[start[0] + x][start[1] + y].hot = isHot;
        }
        gridOrder.push({ x: start[0] + x, y: start[1] + y, taken: !isHot });
      });
      let { words, pointTally } = validate(cleanGrid, firstTurn, wordsLogged, false);
      if (badCookie || pointTally === 0) return;
      pointTally = choice.numHotTiles === 7 ? pointTally + 50 : pointTally;

      candidates.push({
        numHotTiles: choice.numHotTiles,
        word: choice.word,
        pointTally,
        start,
        remaining: choice.remaining,
        gridOrder,
        points: choice.points,
        reverseOrder: choice.reverseOrder,
        wordsLogged: words,
      });
    });

    let bestWord = _.orderBy(candidates, ["pointTally"], ["desc"])[0];

    if (!bestWord) {
      return false;
    }

    for (let i = 0; i < bestWord.word.length; i++) {
      if (bestWord.gridOrder[i].taken) {
        i++;
      }
      if (i < bestWord.word.length) {
        if (!$(`[data-location="${bestWord.gridOrder[i].x},${bestWord.gridOrder[i].y}"]`).children().length) {
          gridState.gridLetters[bestWord.gridOrder[i].x][bestWord.gridOrder[i].y].letter = bestWord.word[i];
          gridState.gridLetters[bestWord.gridOrder[i].x][bestWord.gridOrder[i].y].pointVal = bestWord.points[i];
          gridState.gridLetters[bestWord.gridOrder[i].x][bestWord.gridOrder[i].y].hot = true;
          let letter = !bestWord.points[i] ? `font-style: italic;">${bestWord.word[i]}` : `">${bestWord.word[i]}`;

          $(`[data-location="${bestWord.gridOrder[i].x},${bestWord.gridOrder[i].y}"]`).append(
            `<div data-drag="${
              ++idCount * 2
            }" class="tile hot pcPlay ui-draggable ui-draggable-handle" style="z-index: 7; left: 0px; top: 0px; position: relative; font-weight: bolder; font-size: medium; width: 50px; height: 55px;${letter}<div style="bottom: 9px; left: 16px; font-weight: bolder; font-size: 8px;">${
              bestWord.points[i]
            }</div></div>`
          );
        }
      }
    }
    return {
      rivalRack: bestWord.remaining,
      pointTally: bestWord.pointTally,
      words: bestWord.wordsLogged,
      bestWord: bestWord.reverseOrder ? bestWord.word.reverse().join("") : bestWord.word.join(""),
    };
  }

  //   return the var holding -> {rivalRack, pointTally: bestWord.pointTally, newWordsLogged};TODO:
}

export { calcPcMove };
