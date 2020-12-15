import { getWordValues } from "./getRequests.js";
import validate from "./boardValidator.js";
import trie from "../src/trie-prefix-tree/index.js";

const abc = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

async function calcPcMove(gridState, firstTurn, wordsLogged, rivalRack) {
  console.log(gridState); //TODO: delete log!

  let rack = [];
  let numBlanks = 0;

  rivalRack.forEach((x) => {
    if (!x.letter) numBlanks++;
    rack.push(x.letter);
  });
  console.log(rivalRack, rack); //TODO: delete log!
  let wordSet = await getWordValues(rack.join("").toLowerCase(), numBlanks);
  console.log(wordSet); //TODO: delete log!

  if (firstTurn) {
    if (!wordSet.length) return; //TODO:return and set var {rivalRack, score: bestWord.pointTally, newWordsLogged}
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
            // console.count();
          }

          if (x > 4 + extraCount) {
            let bigIndex = extraIndex[candidates.length - (extraCount + 5)];
            start = bigIndex === 5 ? 6 : 5;
            // console.log(start, extraIndex, bigIndex);
          }

          x < 5 && index === 0 && points > 1 && wordSlice[x].word.length > 4 ? (start = 3) : (start = start);

          cleanGrid.gridLetters[7][start + index].letter = letter;
          cleanGrid.gridLetters[7][start + index].pointVal = points;
          cleanGrid.gridLetters[7][start + index].hot = true;
        });

      let { words, pointTally } = validate(cleanGrid, firstTurn, wordsLogged, false);
      candidates.push({ word: words[0], pointTally, start });
    }

    // console.log(rivalRack, rack); //TODO: delete log!
    // console.log(candidates, "ext: " + extraCount, "surplus: " + (candidates.length - (extraCount + 5)));

    let bestWord = _.orderBy(candidates, ["pointTally"], ["desc"])[0];
    // console.log(bestWord);

    if (!bestWord) return false;

    let tiles = [];

    bestWord.word.split("").forEach((letter, index) => {
      let rackIndex = rack.findIndex((tile) => tile === letter);
      if (rackIndex === -1) rackIndex = rack.findIndex((tile) => tile === "");

      if (rackIndex > -1) {
        tiles.push(rivalRack[rackIndex]);

        rack.splice(rackIndex, 1);
        rivalRack.splice(rackIndex, 1);

        letter = !tiles[index].points ? `<i>${letter}</i>` : letter;

        $(`[data-location="7,${bestWord.start + index}"]`).append(
          `<div data-drag="5" class="tile hot ui-draggable ui-draggable-handle" style="z-index: 7; left: 0px; top: 0px; position: relative; font-weight: bolder; font-size: medium; width: 50px; height: 55px;">${letter}<div style="bottom: 9px; left: 16px; font-weight: bolder; font-size: 8px;">${tiles[index].points}</div></div>`
        );
      }
    });
    // console.log(rivalRack, tiles); //TODO: remove me!!
  } else {
    // startingCoords.forEach((coord) => {});
    // ?startingCoords = the squares on the board where we can build off from
    let startingCoords = {};
    let tilesPlayedCoords = [];
    let tilesPlayed = $("#board .tile").parent().toArray();

    tilesPlayed.forEach((coord) => {
      tilesPlayedCoords.push(coord.getAttribute("data-location").split(",").map(Number));
    });
    let tileCompare = tilesPlayedCoords.map((x) => x.join(""));

    tilesPlayedCoords.forEach((coord) => {
      // let startCompare = startingCoords.map((x) => x.join(""));
      let locations = [];
      if (!tileCompare.includes([coord[0] - 1, coord[1]].join("")) && coord[0] !== 0)
        locations.push({
          // free: [coord[0] - 1, coord[1]],
          free: coord,
          branch: "up",
        }); // one square up
      if (!tileCompare.includes([coord[0] + 1, coord[1]].join("")) && coord[0] !== 14)
        locations.push({
          // free: [coord[0] + 1, coord[1]],
          free: coord,
          branch: "down",
        }); // one square down
      if (!tileCompare.includes([coord[0], coord[1] - 1].join("")) && coord[1] !== 0)
        locations.push({
          // free: [coord[0], coord[1] - 1],
          free: coord,
          branch: "left",
        }); // one square left
      if (!tileCompare.includes([coord[0], coord[1] + 1].join("")) && coord[1] !== 14)
        locations.push({
          // free: [coord[0], coord[1] + 1],
          free: coord,
          branch: "right",
        }); // one square right

      locations.forEach((location) => {
        // && !startCompare.includes(location.free.join(""))
        // if (!tileCompare.includes(location.free.join(""))) {
        if (!startingCoords[`${location.free.join("")}`]) {
          startingCoords[`${location.free.join("")}`] = { coord: location.free, branch: [] };
        }

        startingCoords[`${location.free.join("")}`].branch.push(location.branch);
        // }
      });
    });

    console.log(tilesPlayedCoords);

    let potentialWordsMain = [];
    // let potentialPointsMain = [];//?use or not?

    tilesPlayedCoords.forEach((tile) => {
      let tileInfo = gridState.gridLetters[tile[0]][tile[1]];
      let addLimit = {
        up: tile[0],
        down: 14 - tile[0],
        left: tile[1],
        right: 14 - tile[1],
      };

      //?>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>extend path<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      let extendPath = (path, isPre) => {
        let potentialWordsMid = [];
        let potentialBranch2WordsMid = [];
        let potentialPointsMid = [];
        let potentialBranch2PointsMid = [];
        let potentialBranch2CoordsMid = [];

        let set = isPre ? "prefix" : "suffix";
        let setTally = `${isPre ? "prefix" : "suffix"}Tally`;

        let supply = {};

        supply[set] = [`${tileInfo.letter}`];
        supply[setTally] = [+`${tileInfo.pointVal}`]; //converts to number //?might be good to keep a string

        // console.log(supply);
        let nextX = tile[0];
        let nextY = tile[1];
        let checkNext = () => {
          //check if and what letters follow in opposite path direction
          path === "up" ? ++nextX : path === "down" ? --nextX : path === "left" ? ++nextY : --nextY;
          let nextCoord = gridState.gridLetters[nextX][nextY];
          if (nextCoord.letter !== " ") {
            supply[set].unshift(nextCoord.letter);
            supply[setTally].unshift(+nextCoord.pointVal); //converts to number //?might be good to keep a string
            checkNext();
          }
          return;
        };

        checkNext();
        //TODO make sure "nextCoord" is still on by comparing suffix.length + tile[0] !== 14
        let checkedOut = []; //suffixes that have already been used to insure no repeats
        let checkedOut4Branch = []; //suffixes that have already been used to insure no repeats
        let level = {
          _1: { potentialWords: [], potentialPoints: [], branch2: [] },
          _2: { potentialWords: [], potentialPoints: [], branch2: [] },
          _3: { potentialWords: [], potentialPoints: [], branch2: [] },
          _4: { potentialWords: [], potentialPoints: [], branch2: [] },
          _5: { potentialWords: [], potentialPoints: [], branch2: [] },
          _6: { potentialWords: [], potentialPoints: [], branch2: [] },
          _7: { potentialWords: [], potentialPoints: [], branch2: [] },
        };
        // !!!!!numBlanks!!!!!
        console.log(supply[set], supply[setTally]); // TODO delete me!!
        //iterate over rack tiles and check for suffix with rack tile prepended to following letters

        // let plus = 0;
        // let successPlus = 0;
        rivalRack = [
          { letter: "R", points: "R" },
          { letter: "S", points: "S" },
          { letter: "E", points: "E" },
          { letter: "", points: "_" },
          { letter: "", points: "_" },
          { letter: "N", points: "N" },
          { letter: "A", points: "A" },
        ].sort((a, b) => (b.letter ? 1 : -1)); //TODO DELETE ME >>keep sort<<
        console.log(
          rivalRack,
          rivalRack.map((x) => x.letter)
        ); //TODO DELETE ME

        // let rackCopy = _.cloneDeep(rivalRack);
        // let max = rivalRack.length - 1;

        // gridState.gridLetters[6][5] = { letter: "S", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles
        // gridState.gridLetters[6][6] = { letter: "Z", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles
        // gridState.gridLetters[5][7] = { letter: " ", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles
        // gridState.gridLetters[6][9] = { letter: "S", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles

        nextX = tile[0]; //resetting value
        nextY = tile[1]; //resetting value
        let mod1 = path === "up" || path === "down" ? 1 : 0;
        let mod2 = mod1 ? 0 : 1;
        path === "up" ? --nextX : path === "down" ? ++nextX : path === "left" ? --nextY : ++nextY;

        let cellsB4 = "";
        let cellsAfter = "";

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
        let jokerUsed = false;
        rivalRack.forEach((start, i) => {
          let letter = start.letter;
          let run = () => {
            if (!letter) return;
            let points = start.points;
            let joined = [...supply[set], letter].join("");
            if (!checkedOut.includes(joined)) {
              //check if the cells on either side of the new tile make a word together
              // console.log(nextX, nextY, mod1, mod2);

              let cellsJoined = (cellsB4 + letter + cellsAfter).trim();

              if (cellsJoined.length > 1 && !trie().hasWord(cellsJoined)) return;
              if (isPre ? trie().isPrefix(joined) : trie().isSuffix(joined)) {
                checkedOut.push(joined);
                level._1.potentialWords.push({
                  a: [...supply[set], letter],
                  b: rivalRack.filter((x, index) => index !== i).map((x) => x.letter),
                });
                level._1.potentialPoints.push({
                  a: [...supply[setTally], points],
                  b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                });
                if (!isPre ? trie().hasWord([...joined].reverse().join("")) : trie().hasWord(joined)) {
                  // !isPre ? console.log([...joined].reverse().join(""), "rev") : console.log(joined, "reg");
                  //setting up 'word tangents'
                  level._1.branch2.push({
                    branch2Words: {
                      a: [letter],
                      b: rivalRack.filter((x, index) => index !== i).map((x) => x.letter),
                    },
                    branch2Points: {
                      a: [points + "1"],
                      b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                    },
                  });
                  // level._1.branch2..push(branch2Points:{
                  //   a: [points + "1"],
                  //   b: rivalRack.filter((x, index) => index !== i).map((x) => x.points),
                  // });
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
        //TODO: check which level._1.branch2 array make a word
        //          !!if there is a word check for branch off in 90-deg (suf+pre)
        // console.log(level._1.branch2Words, level._1.branch2Points);
        let nextXRotated = nextX;
        let nextYRotated = nextY;
        let nextXRotatedInverse = nextX;
        let nextYRotatedInverse = nextY;
        let startingCell = gridState.gridLetters[nextXRotated][nextYRotated];
        let startingCellInverse = gridState.gridLetters[nextXRotatedInverse][nextYRotatedInverse];
        let count = 0;
        let checkBranchLevel = (prev, cur) => {
          // console.log(prev.branch2Words);
          ++count;
          // if (count++) {
          path === "up" || path === "down" ? --nextYRotated : --nextXRotated;
          path === "up" || path === "down" ? ++nextYRotatedInverse : ++nextXRotatedInverse;
          startingCell = gridState.gridLetters[nextXRotated][nextYRotated];
          startingCellInverse = gridState.gridLetters[nextXRotatedInverse][nextYRotatedInverse];
          let borderCell;
          let borderCellInverse;
          if (path === "up" || path === "down") {
            borderCell = gridState.gridLetters[nextXRotated][nextYRotated - 1];
            borderCellInverse = gridState.gridLetters[nextXRotatedInverse][nextYRotatedInverse + 1];
          } else {
            borderCell = gridState.gridLetters[nextXRotated - 1][nextYRotated];
            borderCellInverse = gridState.gridLetters[nextXRotatedInverse + 1][nextYRotatedInverse];
          }
          // console.log(borderCellInverse);
          // }
          // console.log(nextXRotated, nextYRotated, nextXRotatedInverse, nextYRotatedInverse);
          mod1 = path === "up" || path === "down" ? 0 : 1;
          mod2 = mod1 ? 0 : 1;
          cellsB4 = "";
          cellsAfter = "";
          let cellsB4Inverse = "";
          let cellsAfterInverse = "";
          for (let k = 0; k < 13; k++) {
            if (mod1 && k) ++mod1;
            if (mod2 && k) ++mod2;

            if (nextYRotated - mod1 >= 0 && nextXRotated - mod2 >= 0) {
              cellsB4 += gridState.gridLetters[nextXRotated - mod2][nextYRotated - mod1].letter;
              cellsB4Inverse += gridState.gridLetters[nextXRotatedInverse - mod2][nextYRotatedInverse - mod1].letter;
            }
            if (nextYRotated + mod1 <= 14 && nextXRotated + mod2 <= 14) {
              cellsAfter += gridState.gridLetters[nextXRotated + mod2][nextYRotated + mod1].letter;
              cellsAfterInverse += gridState.gridLetters[nextXRotatedInverse + mod2][nextYRotatedInverse + mod1].letter;
            }
          }

          cellsB4 = cellsB4.split(" ")[0].split("").reverse().join("");
          cellsB4Inverse = cellsB4Inverse.split(" ")[0].split("").reverse().join("");
          cellsAfter = cellsAfter.split(" ")[0];
          cellsAfterInverse = cellsAfterInverse.split(" ")[0];

          prev.branch2Words.forEach((start, i) => {
            jokerUsed = false;
            let joker2Used = false;
            let joker3Used = false;

            start.b.forEach((letter, i2) => {
              // console.log(nextXRotated, nextYRotated, [...start.a, letter].join(""));
              let run = () => {
                let temp1 = { branch2Words: [], branch2Points: [], branch2Coord: [] };
                let temp2 = { branch2Words: [], branch2Points: [], branch2Coord: [] };
                if (!letter) return; //!check if start.a has already been used with a blank
                let originalLetter = letter;
                let points = prev.branch2Points[i].b[i2];
                //!  1.0
                let taken = false;
                if (count === 1 || prev.branch2Coord[i].type === 1 || prev.branch2Coord[i].type === 3) {
                  if (startingCell !== undefined && startingCell.letter !== " ") {
                    letter = startingCell.letter;
                    points = startingCell.pointVal; //?string number value (can help determine which cells are taken)
                    taken = true;
                  }
                  let cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                  if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                    let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
                    let boarderLetter = isBordered ? borderCell.letter : "";
                    let joined = [boarderLetter, letter, ...start.a].join("");
                    if (!checkedOut4Branch.includes(joined)) {
                      //?^^move to else condition without "!"^^?
                      if (trie().isSuffix(joined.split("").reverse().join("") || trie().isPrefix(joined))) {
                        checkedOut4Branch.push(joined); //?
                        temp1.branch2Words.push({
                          // cur.branch2Words.push({
                          a: [letter, ...start.a],
                          b: start.b.filter((x, index) => index !== i2),
                        });
                        temp1.branch2Points.push({
                          // cur.branch2Points.push({
                          a: [points, ...prev.branch2Points[i].a],
                          b: prev.branch2Points[i].b.filter((x, index) => index !== (taken ? 8 : i2)),
                        });
                        temp1.branch2Coord.push({ coords: [nextXRotated, nextYRotated], isEnd: false, type: 1 });
                        // cur.branch2Coord.push({ coords: [nextXRotated, nextYRotated], isEnd: false, type: 1 });
                        //!1.1
                        if (
                          (temp1.branch2Words[0].b.length && count === 1) ||
                          (temp1.branch2Words[0].b.length && prev.branch2Coord[i].type === 3)
                        ) {
                          let run4Type3 = () => {
                            let taken = false;
                            letter = temp1.branch2Words[0].b[0];
                            points = temp1.branch2Points[0].b[0];
                            if (!letter) return; //!check if start.a has already been used with a blank
                            if (startingCellInverse !== undefined && startingCellInverse.letter !== " ") {
                              letter = startingCellInverse.letter;
                              points = startingCellInverse.pointVal; //?string number value (can help determine which cells are taken)
                              taken = true;
                            }
                            cellsJoined = (cellsB4Inverse + letter + cellsAfter).trim();
                            if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                              let isBordered =
                                borderCellInverse !== undefined && borderCellInverse.letter !== " " ? true : false;
                              let boarderLetter = isBordered ? borderCellInverse.letter : "";
                              let joined = [...temp1.branch2Words[0].a, letter, boarderLetter].join("");
                              if (!checkedOut4Branch.includes(joined)) {
                                if (trie().isSuffix(joined.split("").reverse().join("") || trie().isPrefix(joined))) {
                                  checkedOut4Branch.push(joined); //?
                                  temp1.branch2Words.unshift({
                                    a: [...temp1.branch2Words[0].a, letter],
                                    b: temp1.branch2Words[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp1.branch2Points.unshift({
                                    a: [...temp1.branch2Points[0].a, points],
                                    b: temp1.branch2Points[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp1.branch2Coord.unshift({
                                    coords: [nextXRotatedInverse, nextYRotatedInverse],
                                    isEnd: true,
                                    type: 3,
                                  });
                                  let test = null;
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
                if (count === 1 || prev.branch2Coord[i].type === 2 || prev.branch2Coord[i].type === 3) {
                  letter = originalLetter;
                  points = prev.branch2Points[i].b[i2];
                  let taken = false;
                  //!    2.0
                  if (startingCellInverse !== undefined && startingCellInverse.letter !== " ") {
                    letter = startingCellInverse.letter;
                    points = startingCellInverse.pointVal; //?string number value (can help determine which cells are taken)
                    taken = true;
                  }
                  let cellsJoined = (cellsB4Inverse + letter + cellsAfter).trim();
                  if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                    let isBordered = borderCellInverse !== undefined && borderCellInverse.letter !== " " ? true : false;
                    let boarderLetter = isBordered ? borderCellInverse.letter : "";
                    let joined = [...start.a, letter, boarderLetter].join("");
                    if (!checkedOut4Branch.includes(joined)) {
                      //?^^move to else condition without "!"^^?
                      if (trie().isSuffix(joined.split("").reverse().join("") || trie().isPrefix(joined))) {
                        checkedOut4Branch.push(joined); //?
                        temp2.branch2Words.unshift({
                          a: [...start.a, letter],
                          b: start.b.filter((x, index) => index !== (taken ? 8 : i2)),
                        });
                        temp2.branch2Points.unshift({
                          a: [...prev.branch2Points[i].a, points],
                          b: prev.branch2Points[i].b.filter((x, index) => index !== i2),
                        });
                        temp2.branch2Coord.push({
                          coords: [nextXRotatedInverse, nextYRotatedInverse],
                          isEnd: true,
                          type: 2,
                        });
                        let test = null;
                        //!  2.1
                        if (
                          (temp2.branch2Words[0].b.length && count === 1) ||
                          (temp2.branch2Words[0].b.length && prev.branch2Coord[i].type === 3)
                        ) {
                          let run4Type3_2 = () => {
                            let taken = false;
                            letter = temp2.branch2Words[0].b[0];
                            points = temp2.branch2Points[0].b[0];
                            if (!letter) return; //!check if start.a has already been used with a blank
                            if (startingCell !== undefined && startingCell.letter !== " ") {
                              letter = startingCell.letter;
                              points = startingCell.pointVal; //?string number value (can help determine which cells are taken)
                              taken = true;
                            }
                            cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                            if ((cellsJoined.length > 1 && trie().hasWord(cellsJoined)) || cellsJoined.length < 2) {
                              let isBordered = borderCell !== undefined && borderCell.letter !== " " ? true : false;
                              let boarderLetter = isBordered ? borderCell.letter : "";
                              let joined = [boarderLetter, letter, ...temp2.branch2Words[0].a].join("");
                              if (!checkedOut4Branch.includes(joined)) {
                                if (trie().isSuffix(joined.split("").reverse().join("") || trie().isPrefix(joined))) {
                                  checkedOut4Branch.push(joined); //?
                                  temp2.branch2Words.unshift({
                                    a: [letter, ...temp2.branch2Words[0].a],
                                    b: temp2.branch2Words[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp2.branch2Points.unshift({
                                    a: [points, ...temp2.branch2Points[0].a],
                                    b: temp2.branch2Points[0].b.filter((x, index) => index !== (taken ? 8 : 0)),
                                  });
                                  temp2.branch2Coord.unshift({
                                    coords: [nextXRotated, nextYRotated],
                                    isEnd: true,
                                    type: 3,
                                  });
                                  let test = null;
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
                // cur.branch2.unshift({branch2Words: });
                temp1.branch2Words.forEach((x, i) => {
                  cur.branch2.unshift({
                    branch2Words: x,
                    branch2Points: temp1.branch2Points[i],
                    branch2Coord: temp1.branch2Coord[i],
                  });
                });
                temp2.branch2Words.forEach((x, i) => {
                  cur.branch2.unshift({
                    branch2Words: x,
                    branch2Points: temp2.branch2Points[i],
                    branch2Coord: temp2.branch2Coord[i],
                  });
                });
                // cur.branch2Words.unshift(...temp1.branch2Words, ...temp2.branch2Words);
                // cur.branch2Points.unshift(...temp1.branch2Points, ...temp2.branch2Points);
                // cur.branch2Coord.unshift(...temp1.branch2Coord, ...temp2.branch2Coord);
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

          prev.potentialWords.forEach((start, i) => {
            jokerUsed = false;
            start.b.forEach((letter, i2) => {
              let run = () => {
                if (!letter) return;
                let taken = false;
                let points = prev.potentialPoints[i].b[i2];
                if (nextCellInfo !== undefined && nextCellInfo.letter !== " ") {
                  letter = nextCellInfo.letter;
                  points = nextCellInfo.pointVal; //?string number value (can help determine which cells are taken)
                  taken = true;
                } else {
                  let cellsJoined = (cellsB4 + letter + cellsAfter).trim();
                  if (cellsJoined.length > 1 && !trie().hasWord(cellsJoined)) return;
                }
                let joined = [...start.a, letter].join("");

                if (!checkedOut.includes(joined)) {
                  if (isPre ? trie().isPrefix(joined) : trie().isSuffix(joined)) {
                    checkedOut.push(joined);
                    cur.potentialWords.push({
                      a: [...start.a, letter],
                      b: start.b.filter((x, index) => index !== (taken ? 8 : i2)),
                    });
                    cur.potentialPoints.push({
                      a: [...prev.potentialPoints[i].a, points],
                      b: prev.potentialPoints[i].b.filter((x, index) => index !== (taken ? 8 : i2)),
                    });
                    let test = null;
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
        // gridState.gridLetters[1][7] = { letter: "E", id: "34", pointVal: "taken3", hot: " " }; //? checking with interrupting tiles
        // gridState.gridLetters[2][7] = { letter: "N", id: "34", pointVal: "taken3", hot: " " };
        // gridState.gridLetters[3][7] = { letter: "E", id: "34", pointVal: "taken3", hot: " " };
        // gridState.gridLetters[4][7] = { letter: "G", id: "34", pointVal: "taken2", hot: " " };
        // gridState.gridLetters[5][7] = { letter: "A", id: "34", pointVal: "taken1", hot: " " };

        // if there is a suffix then repeat until there is no suffix || no more tiles to add || can't make longer
        if (rivalRack.length > 1) {
          for (let j = 1; j < rivalRack.length; j++) {
            checkBranchLevel(level[`_${j}`].branch2, level[`_${j + 1}`].branch2);
            if (level[`_${j}`].branch2Words.length) {
              potentialBranch2WordsMid.unshift(...level[`_${j + 1}`].branch2Words);
              potentialBranch2PointsMid.unshift(...level[`_${j + 1}`].branch2Points);
              potentialBranch2CoordsMid.unshift(...level[`_${j + 1}`].branch2Coord);
            }
            // prettier-ignore
            // console.log(`potentials${j + 1}`, level[`_${j + 1}`].branch2Words, level[`_${j + 1}`].branch2Points, level[`_${j + 1}`].branch2Coord); //?rest of the levels one by one
            if (j + 1 <= addLimit[`${path}`]) {
              let x = path === "up" ? tile[0] - (j + 1) : path === "down" ? tile[0] + (j + 1) : tile[0];
              let y = path === "left" ? tile[1] - (j + 1) : path === "right" ? tile[1] + (j + 1) : tile[1];

              nextCellInfo = gridState.gridLetters[x][y];
              // console.log(x, y, nextCellInfo); //? displays cell info by coord

              checkLevel(level[`_${j}`], level[`_${j + 1}`]);
              // prettier-ignore
              // console.log(`potentials${j + 1}`, level[`_${j + 1}`].potentialWords, level[`_${j + 1}`].potentialPoints); //?rest of the levels one by one
              
              potentialWordsMid.unshift(...level[`_${j + 1}`].potentialWords);
              potentialPointsMid.unshift(...level[`_${j + 1}`].potentialPoints);
            }
          }
        }
        // console.log("checkedOut:", checkedOut, level._1.potentialWords, level._1.potentialPoints, rackCopy);//? level one<<<<<<
        // console.log("W-Mid:", potentialWordsMid, "P-Mid:", potentialPointsMid);
        // console.log(level._1.branch2); //? tangent branch
        // check starting from the longest suffix if word -> put words in "main" array with path

        for (let i = 0; i < potentialWordsMid.slice(0, 22).length; i++) {
          // cap number of words coming from each cell to 22
          let word = potentialWordsMid[i];
          let setWord = isPre ? word.a : word.a.reverse();
          let setPoints = isPre ? potentialPointsMid[i].a : potentialPointsMid[i].a.reverse();

          if (trie().hasWord(setWord.join(""))) {
            // potentialWordsMain.push({
            //   numHotTiles: 7 - word.b.length,
            //   startCoord: [tile[0], tile[1]],
            //   word: setWord,
            //   points: setPoints,
            //   path,
            //   reverseOrder: isPre ? false : true,
            // }); //?uncomment
          }
        }
        for (let i = 0; i < potentialBranch2WordsMid.slice(0, 102).length; i++) {
          // cap number of words coming from each cell to 22
          let word = potentialBranch2WordsMid[i];
          // let setWord = isPre ? word.a : word.a.reverse();
          let setWord = word.a;
          // let setPoints = isPre ? potentialBranch2PointsMid[i].a : potentialBranch2PointsMid[i].a.reverse();
          let setPoints = potentialBranch2PointsMid[i].a;

          if (trie().hasWord(setWord.join(""))) {
            potentialWordsMain.push({
              a_set: supply[set].join(""),
              numHotTiles: 7 - word.b.length,
              startCoord: potentialBranch2CoordsMid[i].coords,
              word: setWord,
              joined: setWord.join(""),
              points: setPoints,
              path,
              a_branch2: true,
              a_isEnd: potentialBranch2CoordsMid[i].isEnd,
              reverseOrder: potentialBranch2CoordsMid[i].isEnd ? true : false,
            });
          }
        }
        // console.log(level._7);
        // let indexList = [];
        // console.log(
        //   potentialBranch2CoordsMid.filter((x, i) => {
        //     if (x.type === 3) indexList.push(i);
        //     return x.type === 3;
        //   })
        // );
        // console.log(potentialBranch2WordsMid.filter((x, index) => indexList.includes(index)));
        // console.log(potentialBranch2PointsMid.filter((x, index) => indexList.includes(index)));
        // console.log(indexList);
        console.log("mainWords", potentialWordsMain);
        // console.log(
        //   "*******************",
        //   potentialBranch2WordsMid,
        //   potentialBranch2PointsMid,
        //   potentialBranch2CoordsMid
        // );

        // if word add letters and points to gridLetters,pointVal,letter => place pointTally + word in arr
      };
      startingCoords[`${tile.join("")}`].branch.forEach((path) => {
        if (path === "up") {
          // extendPath(path, false); //?parameters ==> (path: string, isPrefix: boolean)
        }

        if (path === "down") {
          extendPath(path, true); //TODO: reactivate
        }
        if (path === "left") {
          // extendPath(path, false);//TODO: reactivate
        }
        if (path === "right") {
          // extendPath(path, true);//TODO: reactivate
        }
      });
      //TODO: >>>>>>>  iterate over main words => place on board => validate() && get Score => rank descending pick best =>render
    });
    //>>>>>>>>>TODO: what pc does when it's not the first turn <<<<<<<<<<
  }
  //   return the var holding -> {rivalRack, score: bestWord.pointTally, newWordsLogged};TODO:
  // console.log(trie().hasWord("zi"));
}

export { calcPcMove };
