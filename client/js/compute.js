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
        let potentialPointsMid = [];

        let set = isPre ? "prefix" : "suffix";
        let setTally = `${isPre ? "prefix" : "suffix"}Tally`;

        let supply = {};

        supply[set] = [`${tileInfo.letter}`];
        supply[setTally] = [+`${tileInfo.pointVal}`]; //converts to number //?might be good to keep a string

        console.log(supply);
        //check if and what letters follow in opposite path direction
        let nextX = tile[0];
        let nextY = tile[1];
        let checkNext = () => {
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
        let level = {
          _1: { potentialWords: [], potentialPoints: [], branch2: [] },
          _2: { potentialWords: [], potentialPoints: [] },
          _3: { potentialWords: [], potentialPoints: [] },
          _4: { potentialWords: [], potentialPoints: [] },
          _5: { potentialWords: [], potentialPoints: [] },
          _6: { potentialWords: [], potentialPoints: [] },
          _7: { potentialWords: [], potentialPoints: [] },
        };
        // !!!!!numBlanks!!!!!
        console.log(supply[set], supply[setTally]); // TODO delete me!!
        //iterate over rack tiles and check for suffix with rack tile prepended to following letters

        // let plus = 0;
        // let successPlus = 0;
        rivalRack = [
          { letter: "R", points: 1 },
          { letter: "S", points: 1 },
          { letter: "E", points: 1 },
          { letter: "", points: 0 },
          { letter: "", points: 0 },
          { letter: "N", points: 1 },
          { letter: "O", points: 1 },
        ].sort((a, b) => (b.letter ? 1 : -1)); //TODO DELETE ME >>keep sort<<
        console.log(
          rivalRack,
          rivalRack.map((x) => x.letter)
        ); //TODO DELETE ME

        // let rackCopy = _.cloneDeep(rivalRack);
        // let max = rivalRack.length - 1;

        rivalRack.forEach((start, i) => {
          let letter = start.letter;
          let run = () => {
            if (!letter) return;
            let points = start.points;
            let joined = [...supply[set], letter].join("");
            if (!checkedOut.includes(joined)) {
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
                if (trie().hasWord([...joined].reverse().join(""))) {
                  level._1.branch2.push({
                    l: [...supply[set], letter],
                    b: [...supply[setTally], points],
                  });
                }
              }
            }
          };
          run();
          if (!letter) {
            abc.forEach((joker) => {
              letter = joker;
              run();
            });
          }
        });
        //TODO: check which level._1.branch2 array make a word
        //          !!if there is a word check for branch off in 90-deg (suf+pre)
        let nextCellInfo;
        let checkLevel = (prev, cur) => {
          prev.potentialWords.forEach((start, i) => {
            start.b.forEach((letter, i2) => {
              let run = () => {
                if (!letter) return;

                let points = prev.potentialPoints[i].b[i2];
                if (nextCellInfo !== undefined && nextCellInfo.letter !== " ") {
                  letter = nextCellInfo.letter;
                  points = nextCellInfo.pointVal; //?string number value (can help determine which cells are taken)
                  i2 = 8;
                }
                let joined = [...start.a, letter].join("");
                if (!checkedOut.includes(joined)) {
                  if (isPre ? trie().isPrefix(joined) : trie().isSuffix(joined)) {
                    checkedOut.push(joined);
                    cur.potentialWords.push({
                      a: [...start.a, letter],
                      b: start.b.filter((x, index) => index !== i2),
                    });
                    cur.potentialPoints.push({
                      a: [...prev.potentialPoints[i].a, points],
                      b: prev.potentialPoints[i].b.filter((x, index) => index !== i2),
                    });
                    let test = null;
                  }
                }
              };
              run();
              if (!letter) {
                abc.forEach((joker) => {
                  letter = joker;
                  run();
                });
              }
            });
          });
        };
        // gridState.gridLetters[1][7] = { letter: "E", id: "34", pointVal: "taken3", hot: " " }; // checking with interrupting tiles
        // gridState.gridLetters[2][7] = { letter: "N", id: "34", pointVal: "taken3", hot: " " };
        // gridState.gridLetters[3][7] = { letter: "E", id: "34", pointVal: "taken3", hot: " " };
        // gridState.gridLetters[4][7] = { letter: "G", id: "34", pointVal: "taken2", hot: " " };
        // gridState.gridLetters[5][7] = { letter: "A", id: "34", pointVal: "taken1", hot: " " };

        // if there is a suffix then repeat until there is no suffix || no more tiles to add || can't make longer
        if (rivalRack.length > 1) {
          for (let j = 1; j < rivalRack.length; j++) {
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
        console.log("W-Mid:", potentialWordsMid, "P-Mid:", potentialPointsMid);
        console.log(level._1.branch2); //? tangent branch
        // check starting from the longest suffix if word -> put words in "main" array with path

        for (let i = 0; i < potentialWordsMid.slice(0, 22).length; i++) {
          // cap words to 22
          let word = potentialWordsMid[i];
          let setWord = isPre ? word.a : word.a.reverse();
          let setPoints = isPre ? potentialPointsMid[i].a : potentialPointsMid[i].a.reverse();

          if (trie().hasWord(setWord.join(""))) {
            potentialWordsMain.push({
              numHotTiles: 7 - word.b.length,
              startCoord: [tile[0], tile[1]],
              word: setWord,
              points: setPoints,
              path,
              reverseOrder: isPre ? false : true,
            });
          }
        }
        console.log("mainWords", potentialWordsMain);

        // if word add letters and points to gridLetters,pointVal,letter => place pointTally + word in arr
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
      //TODO: >>>>>>>  iterate over main words => place on board => validate() && get Score => rank descending pick best =>render
    });
    //>>>>>>>>>TODO: what pc does when it's not the first turn <<<<<<<<<<
  }
  //   return the var holding -> {rivalRack, score: bestWord.pointTally, newWordsLogged};TODO:
}

export { calcPcMove };
