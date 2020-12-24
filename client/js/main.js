localforage.config({
  driver: [localforage.INDEXEDDB, localforage.WEBSQL],
  name: "Scrabble_Game",
});
import letters from "./scrabbleLetters.js";
import { getWordTrieStr } from "./getRequests.js";
import { calcPcMove } from "./compute.js";
import { gridState, updateGameState } from "./createGrid.js";
import validate from "./boardValidator.js";
// import trie from "../src/trie-prefix-tree/index.js";
// ?  temp1.forEach((x,i) => console.log(trie().hasWord(x), i))
// console.log(trie);

let playerScore = 0;
let computerScore = 0;
let lettersUsed = 0;
let passCount = 0;
let isZoomed = false;
let fired = false;
let overRack = false;
let firstTurn = true;
let isValidMove = false;
let playersTurn = false;
let wordsLogged = [];

const debugging = false; //? change to true for the AI to play it self

let bag = _.shuffle(_.shuffle(letters)); //TODO: change to const
// bag = _.drop(bag, 80); //TODO: remove after tests
let rivalRack = [];

updateGameState();
getWordTrieStr();

// getWordValues(); //? use in case that you want to sort sub-anas by score descending

function deal2Player() {
  for (let i = 0; i < 7; i++) {
    let { letter, points } = _.pullAt(bag, [0])[0];
    $(`#rack`).append(`
        <div data-drag=${i} class="tile hot">${letter}<div>${points ? points : ""}</div></div>
        `);
    setDraggable($(`[data-drag="${i}"]`));
  }
}

function deal2PC() {
  for (let i = 0; i < 7; i++) {
    rivalRack.push(_.pullAt(bag, [0])[0]);
  }
}

function whoStarts() {
  let bagSim = _.shuffle(bag);
  return {
    player: _.pullAt(bagSim, [0])[0].letter,
    pc: _.pullAt(bagSim, [0])[0].letter,
  };
}

function alertStarter(winner) {
  //TODO: alert user who plays first
  // console.log(winner);
}

function startGame() {
  let { player, pc } = whoStarts();
  if (player === pc) return startGame();

  lettersUsed = 14;
  $("#bagBtn").text(100 - lettersUsed);

  $("#startGame").attr("disabled", "disabled"); //TODO: remove start btn
  resetSortable();

  if (player < pc) {
    deal2Player();
    deal2PC();
    playersTurn = true;
    alertStarter("you");
    if (debugging) {
      playersTurn = true;
      pcPlay();
    }
  } else {
    playersTurn = false;
    deal2PC();
    deal2Player();
    alertStarter("computer");
    pcPlay();
  }
}

function repaintBoard() {
  isValidMove = false;
  updateGameState();
  isValidMove = validate(gridState, firstTurn, wordsLogged, true);
  // console.log(isValidMove);
}
function bigTile(tile) {
  tile
    .css({
      width: "50px",
      height: "55px",
      "font-weight": "bolder",
      "font-size": "xx-large",
    })
    .children("div")
    .css({
      bottom: "12px",
      left: "32px",
      "font-weight": "bolder",
      "font-size": "small",
    });
}

function smallTile(tile) {
  tile
    .css({
      "font-size": "medium",
    })
    .children("div")
    .css({
      bottom: "9px",
      left: "16px",
      "font-size": "8px",
    });
}

function zoomIn(elm) {
  if (!isZoomed) {
    $("#board").css({
      height: "705px",
      width: "640px",
      "grid-template-columns": "repeat(15, 52px)",
      "grid-template-rows": "repeat(15, 57px)",
      "justify-content": "safe center",
      margin: "0",
    });
    bigTile($("#board .tile"));
    isZoomed = true;
    if (elm) elm.scrollIntoView({ block: "center", inline: "center" });
  }
}

function zoomOut() {
  if (!isZoomed) return;
  $("#board").css({
    height: "412.5px",
    width: "400px",
    "grid-template-columns": "repeat(15, 27.5px)",
    "grid-template-rows": "repeat(15, 27.5px)",
    "justify-content": "center",
    margin: "0 auto",
  });
  smallTile($("#board .tile"));
  isZoomed = false;
}

startGame(); //TODO: remove after done w/ pc move
// pcPlay(); //TODO: remove after done w/ pc move

function pcSwap() {
  //? .sort((a,b) => b > a ? -1 : 1).filter(x => x !== 0) //for sorting by point value and removing blank tiles
  let numTilesLeftInBag = bag.slice(0, 7).length;
  let tilesLeftInRivalRack = rivalRack.slice(0, 7);
  let numTilesLeftInRivalRack = rivalRack.slice(0, 7).length;

  let bool = numTilesLeftInBag <= numTilesLeftInRivalRack;
  let maxNumTilesToSwap = bool ? numTilesLeftInBag : numTilesLeftInRivalRack;

  rivalRack = bool ? rivalRack.slice(0, 7 - maxNumTilesToSwap) : rivalRack.slice(7 - maxNumTilesToSwap);

  for (let i = 0; i < maxNumTilesToSwap; i++) {
    if (bag.length) {
      rivalRack.push(_.pullAt(bag, [0])[0]);
    }
  }

  bag.push(...tilesLeftInRivalRack.slice(0, maxNumTilesToSwap));
  bag = _.shuffle(_.shuffle(bag));
  console.log(rivalRack, bag);
  passCount = -1;
  pass(true);
}

function pcPlay() {
  // console.log("pc's turn");
  playersTurn = false;

  // if (rivalRack.length < 7 && !bag.length && prompt()) {
  //   rivalRack = Array(7).fill({ letter: "Q", points: 10 });
  // }

  //TODO:
  zoomOut();
  rivalRack.sort((a, b) => (b.letter ? 1 : -1)); //make sure that blanks are last tile
  setTimeout(async () => {
    try {
      isValidMove = await calcPcMove(gridState, firstTurn, wordsLogged, rivalRack);
      // console.log(isValidMove);
      // prettier-ignore
      !isValidMove && rivalRack.length && bag.length ? 
      pcSwap() : isValidMove ? 
      play() : debugging ? 
      false : pass(true);
    } catch (error) {
      if (error?.message?.includes("ranch")) {
        return console.error(error);
      }

      console.error(error);
      pcPlay();
    }
  }, 50);
  // $("#board .tile").removeClass("pcPlay"); //TODO: find a better place for this
}

function endGame() {
  //TODO:
  //?prevent players from continuing
  //?remove hot tiles from board
  console.log(rivalRack, wordsLogged);
  throw "Game Over";
  //in modal display:
  //  both players points
  //  declare winner
  //  offer rematch
  // console.log("gameOver");
}

function swap() {
  //TODO:
  // console.log("Swap");
  //show player's letters and ask which letters to swap
  //->if cancel
  //    close modal and return
  //->if confirm
  //    remove chosen letters
  //    pick new letters in exchange and place them on player's rack
  //    take chosen letters and insert in to bag
}

function mix() {
  if ($("#rack .tile").length < 2) return;
  let shuffledRack = _.shuffle($("#rack .tile").toArray());
  $("#rack .tile").remove();
  shuffledRack.forEach((tile) => {
    $("#rack").append(tile);
    setDraggable($(tile));
  });
}

function recall() {
  if (!$(".column .hot").length) return;
  // console.log("Recall");
  //remove all "hot" tiles from ".column .hot" and re-add them to player's rack
  let toBeRecalled = $(".column .hot").toArray();
  $(".column .hot").remove();
  toBeRecalled.forEach((tile) => {
    $("#rack").append(tile);
    setDraggable($(tile));
  });
  //trigger draggable "stop" in order to update game's state
  repaintBoard();
  $("#passPlay").text("Pass");
}

function pass(wasClicked = false) {
  //TODO:
  // console.log("turn passed");
  //if param = true ->
  //    add to passCount
  if (wasClicked) passCount++;
  //if param = false ->
  //    make sure firstTurn is set to false
  //    reset passCount to equal 0
  if (!wasClicked) {
    if (firstTurn) firstTurn = false;
    passCount = 0;
  }
  //if passCount = 4 ->
  //    end game
  if (passCount === 4) return endGame();
  //    allow next turn
  // if (debugging) firstTurn = false;
  setTimeout(() => {
    if (playersTurn) $("#board .tile").removeClass("pcPlay"); //TODO: make sure this is the best place for this

    playersTurn || debugging ? pcPlay() : (playersTurn = true);
  }, 250);
}

function play() {
  //TODO: make compatible with pc plays
  if (!isValidMove.words && debugging) playersTurn = true;
  if (!isValidMove.words) return alert(isValidMove); //TODO: make into modal alert
  // console.log("word played");

  if (isValidMove.hasOwnProperty("rivalRack")) {
    computerScore += isValidMove.pointTally;
    $("#pcScore").text(computerScore);
    // console.log("computerScore: ", computerScore);
    // add and display pc's score
  } else {
    playersTurn = true;
  }
  if (playersTurn) {
    playerScore += isValidMove.pointTally;
    $("#playerScore").text(playerScore);
    // console.log("playerScore: ", playerScore);
    //calculate and add points to "player"
  }

  wordsLogged = isValidMove.words; //adding to the words that have been played

  if (playersTurn) {
    let refill = $("#board .hot").length;
    let tilesPlayed = $("#board .hot").parent().toArray();
    //fill rack back up to 7 or what ever is left in bag
    for (let i = 0; i < refill; i++) {
      //remove multipliers from gridMultipliers
      let coords = tilesPlayed[i].getAttribute("data-location").split(",");
      gridState.gridMultipliers[+coords[0]][+coords[1]] = " ";
      gridState.gridLetters[+coords[0]][+coords[1]].hot = false;

      if (bag.length) {
        let { letter, points } = _.pullAt(bag, [0])[0];
        // console.log(letter, points);
        $(`#rack`).append(`
    <div data-drag=${++lettersUsed} class="tile hot">${letter}<div>${points ? points : ""}</div></div>
    `);
        setDraggable($(`[data-drag="${lettersUsed}"]`));
      }
    }

    if (!bag.length && (!$("#rack .tile").length || !rivalRack.length)) {
      return endGame();
    }

    // console.log("letters used: ", lettersUsed);
    $("#bagBtn").text(100 - lettersUsed);
    resetSortable();

    //disable drag on "hot" tiles, remove "hot" & "multiplier" class from ".column .hot" and call pass()
    $("#board .hot").draggable("destroy").removeClass("hot").parent().removeClass(["dw", "tw", "dl", "tl"]);
  } else {
    rivalRack = isValidMove.rivalRack;
    let refill = $("#board .hot").length;
    let tilesPlayed = $("#board .hot").parent().toArray();
    //fill rack back up to 7 or what ever is left in bag
    for (let i = 0; i < refill; i++) {
      //remove multipliers from gridMultipliers
      let coords = tilesPlayed[i].getAttribute("data-location").split(",");
      gridState.gridMultipliers[+coords[0]][+coords[1]] = " ";
      gridState.gridLetters[+coords[0]][+coords[1]].hot = false;

      if (bag.length) {
        rivalRack.push(_.pullAt(bag, [0])[0]);
        ++lettersUsed;
      }
    }
    if (!bag.length && (!$("#rack .tile").length || !rivalRack.length)) {
      console.log("Game!!");
      return endGame();
    }

    // console.log("letters used: ", lettersUsed, rivalRack);
    $("#bagBtn").text(100 - lettersUsed);
    //disable drag on "hot" tiles, remove "hot" & "multiplier" class from ".column .hot" and call pass()
    $("#board .hot").removeClass(["hot"]).parent().removeClass(["dw", "tw", "dl", "tl"]);
  }
  //set firstTurn & isValidMove to false
  if (firstTurn) firstTurn = false;
  isValidMove = false;

  $("#passPlay").text("Pass");
  pass();
}

function showBagContent() {
  //TODO: make into modal
  // list letters + blank and how many remain of each tile
}
function showScoreHistory() {
  //TODO: make into modal
  //show list of moves. who played what and how many points were earned
}

$("#bagBtn").click(showBagContent);
$("#scoresBtn").click(showScoreHistory);
$("#mix").click(() => ($("#rack .tile").length > 1 ? mix() : undefined));
$("#swapRecall").click(() => ($("#swapRecall").text() == "Swap" ? swap() : recall()));
$("#passPlay").click(() => ($("#passPlay").text() === "Pass" ? pass(true) : play()));
$("#startGame").click(startGame);
$("#zoomOut").click(zoomOut);
$("#board .column").dblclick((e) => (isZoomed ? zoomOut() : zoomIn(e.target)));

function setDraggable(x) {
  x.draggable({
    connectToSortable: "#rack",
    scroll: false,
    revert: "invalid",
    zIndex: 100,
    stack: ".tile",
    start: function (event, ui) {
      ui.helper.data("rejected", false);
      ui.helper.data("original-position", ui.helper.offset());
    },
    stop: function (event, ui) {
      if (ui && ui.helper)
        if (ui.helper.data("rejected") === true) {
          ui.helper.offset(ui.helper.data("original-position"));
        }

      removeDuplicates();

      setTimeout(() => {
        repaintBoard();
      }, 300); //repaintBoard Game/Grid State here
    },
  });
}

function resetSortable() {
  $("#rack").sortable({
    placeholder: "ph-class",
    scroll: false,
    tolerance: "intersect",
    revert: 200,
    out: function (event, ui) {
      overRack = false;
      if (isZoomed) return;
      smallTile(ui.item);
    },
    over: function (event, ui) {
      overRack = true;
      fired = false;
      bigTile(ui.item);
    },
  });
  $("#rack").disableSelection();
}

$(".column").droppable({
  accept: ".tile",
  tolerance: "intersect",
  drop: function (ev, ui) {
    if (!fired || overRack) {
      fired = true;
      if (!overRack) $(".tile").css({ left: "0", top: "0" });
      return;
    }

    if ($(this).children(".tile").length > 0) {
      ui.helper.data("rejected", true);
      return false;
    }

    let tileClone = $(ui.draggable);
    $(this).append(tileClone);

    removeDuplicates();

    setDraggable(tileClone);
    $(tileClone).css({
      position: "relative",
      left: "0",
      top: "0",
    });

    zoomIn();
    tileClone[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  },
});

function removeDuplicates() {
  $(".tile").each((i) => {
    if ($(`[data-drag="${i}"]`).length > 1) {
      $(`[data-drag="${i}"]`).slice(0, -1).remove();
    }
  });
}
