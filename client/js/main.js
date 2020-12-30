localforage.config({
  driver: [localforage.INDEXEDDB, localforage.WEBSQL],
  name: "Scrabble_Game",
});

import { generateRack, doSwap } from "./letterSwap.js";
import { generateTable } from "./playHIstory.js";
import { generateOptions } from "./blankOptions.js";
import { generateRemainder } from "./remainingLetters.js";
import toggleModal from "./modal.js";
import letters from "./scrabbleLetters.js";
import { getWordTrieStr } from "./getRequests.js";
import { calcPcMove } from "./compute.js";
import { gridState, updateGameState, cleanTheGrid } from "./createGrid.js";
import validate from "./boardValidator.js";
// ?  temp1.forEach((x,i) => console.log(trie().hasWord(x), i))
// window.toggleModal = toggleModal; //? uncomment to let method be available in console

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
let history = [];
let rivalRack = [];

const debugging = false; //? change to true for the AI to play it self

let bag = _.shuffle(_.shuffle(letters));
// bag = _.drop(bag, 86); //? uncomment for doing tests on a shorter game

updateGameState();
getWordTrieStr();

// getWordValues(); //? use in case that you want to sort sub-anas by score descending

function deal2Player() {
  for (let i = 0; i < 7; i++) {
    // let { letter, points } = { letter: "", points: 0 }; //? uncomment to test player turn with blank tiles
    let { letter, points } = _.pullAt(bag, [0])[0];
    $(`#rack`).append(`
        <div data-drag=${i} class="tile hot ${points ? "" : "blank"}">${letter}<div>${points ? points : ""}</div></div>
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
  //? alert user who plays first
  toggleModal({
    modal: { class: "", content: "" },
    modalPlacer: { class: "modal-dialog-centered", content: "" },
    title: { class: "", content: winner },
    body: { class: "d-none", content: "" },
    footer: { class: "d-none", content: "" },
    actionButton: { class: "", content: "" },
    timeout: 2250,
    executeClose: false,
  });
}

function startGame() {
  $("#startGame").hide();

  let { player, pc } = whoStarts();
  if (player === pc) return startGame();

  lettersUsed = 14;
  $("#bagBtn").text(100 - lettersUsed);

  $("#startGame").attr("disabled", "disabled");
  resetSortable();

  if (player < pc) {
    deal2Player();
    deal2PC();
    playersTurn = true;
    alertStarter("You won the draw and will start");
    if (debugging) {
      playersTurn = true;
      pcPlay();
    }
  } else {
    playersTurn = false;
    deal2PC();
    deal2Player();
    alertStarter("Opponent won the draw and will start");
    setTimeout(() => {
      pcPlay();
    }, 3000);
  }
}

function rematch() {
  location.reload();
  //TODO: implement rematch without reloading page
  // cleanTheGrid();
  // zoomOut();
  // playerScore = 0;
  // computerScore = 0;
  // lettersUsed = 0;
  // passCount = 0;
  // isZoomed = false;
  // fired = false;
  // overRack = false;
  // firstTurn = true;
  // isValidMove = false;
  // playersTurn = false;
  // wordsLogged = [];

  // history = [];

  // rivalRack = [];

  // bag = _.shuffle(_.shuffle(letters));

  // $("#playerScore").text(playerScore);
  // $("#pcScore").text(computerScore);

  // $("#actionBar .btn").css({ "pointer-events": "all" });
  // startGame();
}

function repaintBoard() {
  isValidMove = false;
  updateGameState();
  isValidMove = validate(gridState, firstTurn, wordsLogged, true);
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

startGame();
generateRemainder(bag);
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
  pass(true, true, true);

  toggleModal({
    executeClose: true,
  });
  toggleModal({
    modal: { class: "", content: "" },
    modalPlacer: { class: "modal-dialog-centered", content: "" },
    title: { class: "", content: "Opponent chose to swap tiles" },
    body: { class: "d-none", content: "" },
    footer: { class: "d-none", content: "" },
    actionButton: { class: "", content: "" },
    timeout: 2250,
    executeClose: false,
  });
}

function pcPlay() {
  toggleModal({
    modal: { class: "", content: "" },
    modalPlacer: { class: "modal-dialog-centered", content: "" },
    title: { class: "", content: "Opponent is thinking..." },
    body: {
      class: "text-center",
      content: `<div class="spinner-container my-2"><svg class="spinner" data-src="https://s.svgbox.net/loaders.svg?ic=circles" fill="currentColor"></svg></div>`,
    },
    footer: { class: "d-none", content: "" },
    actionButton: { class: "", content: "" },
    timeout: 0,
    executeClose: false,
  });
  playersTurn = false;

  // if (rivalRack.length < 7 && !bag.length && prompt()) {
  //   rivalRack = Array(7).fill({ letter: "Q", points: 10 });
  // }
  // rivalRack = Array(7).fill({ letter: "Q", points: 10 }); //[...rivalRack.slice(0, 6), { letter: "", points: 0 }]; //? uncomment for testing

  zoomOut();
  rivalRack.sort((a, b) => (b.letter ? 1 : -1)); //make sure that blanks are last tile
  setTimeout(async () => {
    try {
      isValidMove = await calcPcMove(gridState, firstTurn, wordsLogged, rivalRack);
      // prettier-ignore
      !isValidMove && rivalRack.length && bag.length ? 
      pcSwap() : isValidMove ? 
      play(true) : debugging ? 
      false : pass(true, false, true);
    } catch (error) {
      if (error?.message?.includes("ranch")) {
        return console.error(error);
      }

      console.error(error);
      pcPlay();
    }
  }, 50);
}

function endGame() {
  zoomOut();
  $("#startGame")[0].removeAttribute("disabled");
  $("#startGame").show();
  $("#actionBar .btn").not("#scoresBtn, #startGame").css({ "pointer-events": "none" }); //?prevent players from continuing (can still see the score history, and shows a button for a rematch)

  $("#board .hot").removeClass(["hot"]).parent().removeClass(["dw", "tw", "dl", "tl"]); //?remove hot tiles from board

  if (!rivalRack.length) {
    let sum = $("#rack .tile")
      .children("div")
      .toArray()
      .reduce((acc, cur) => acc + +cur.innerHTML, 0);

    history.push({
      isAI: true,
      word: "Opponent Won",
      points: "",
      score: { computerScore: `${computerScore} + ${sum}`, playerScore: `${playerScore} - ${sum}` },
      skip: false,
    });
    generateTable(history);

    playerScore -= sum;
    computerScore += sum;

    playerScore = playerScore < 0 ? 0 : playerScore;
    computerScore = computerScore < 0 ? 0 : computerScore;
    $("#playerScore").text(playerScore);
    $("#pcScore").text(computerScore);
    //? deduct points from player and give them to AI
  }

  if (!$("#rack .tile").length) {
    let sum = rivalRack.reduce((acc, cur) => acc + cur, 0);

    history.push({
      isAI: false,
      word: "Player Won",
      points: "",
      score: { computerScore: `${computerScore} - ${sum}`, playerScore: `${playerScore} + ${sum}` },
      skip: false,
    });
    generateTable(history);

    playerScore += sum;
    computerScore -= sum;

    playerScore = playerScore < 0 ? 0 : playerScore;
    computerScore = computerScore < 0 ? 0 : computerScore;

    $("#playerScore").text(playerScore);
    $("#pcScore").text(computerScore);
    //? deduct points from AI and give them to player
  }

  let winner = playerScore > computerScore ? "You" : "Opponent";

  setTimeout(() => {
    toggleModal({
      modal: { class: "text-center", content: "" },
      modalPlacer: { class: "modal-dialog-centered", content: "" },
      title: { class: "", content: `${winner} Won, Good Game` },
      body: {
        class: "",
        content: `<div class="text-primary font-weight-bold">Player: ${playerScore}</div><div class="text-danger font-weight-bold">Opponent: ${computerScore}</div>`,
      },
      footer: { class: "", content: "" },
      actionButton: { class: "rematch", content: "Rematch" },
      timeout: 0,
      executeClose: false,
    });

    $(".rematch").click(rematch);
  }, 1650);

  //in modal display:
  //  both players points
  //  declare winner
  //  offer rematch
}

function swap() {
  toggleModal({
    modal: { class: "text-center", content: "" },
    modalPlacer: { class: "modal-dialog-centered", content: "" },
    modalHeader: { class: "d-none", content: "" },
    title: {
      class: "",
      content: "",
    },
    body: {
      class: "mh-100",
      content:
        ($("#rack .tile").length > bag.length
          ? `<div class="alert alert-danger" role="alert">You can only swap up to ${bag.length} tile(s)</div>`
          : ``) + generateRack($("#rack").children(".tile").toArray()),
    },
    footer: { class: "justify-content-center", content: "" },
    actionButton: { class: "executeSwap", content: "Confirm" },
    timeout: 0,
    executeClose: false,
  });
  $(".selectTile").click(function () {
    let under = $(".selected").length < bag.length;
    if (under || $(this).hasClass("selected")) {
      $(this).toggleClass("selected");
    }
  });
  //show player's letters and ask which letters to swap
  //->if cancel
  //    close modal and return
  //->if confirm
  //    remove chosen letters
  //    pick new letters in exchange and place them on player's rack
  //    take chosen letters and insert in to bag
  $(".executeSwap").click((e) => {
    e.stopImmediatePropagation();
    if (!$(".selected").length) return;
    let { newBag, newRack } = doSwap(bag, $(".selectTile").toArray());
    bag = newBag;
    $(`#rack`).empty();
    newRack.forEach((x) => {
      $(`#rack`).append(`
      <div data-drag=${x.drag} class="tile hot">${x.letter}<div>${x.points ? x.points : ""}</div></div>
      `);
      setDraggable($(`[data-drag="${x.drag}"]`));
    });

    passCount = -1;
    pass(true, true, false);
  });
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
  //remove all "hot" tiles from ".column .hot" and re-add them to player's rack
  let toBeRecalled = $(".column .hot").toArray();
  $(".column .hot").remove();
  toBeRecalled.forEach((tile) => {
    if ($(tile).hasClass("setBlank") && $(tile).hasClass("hot")) {
      $(tile).html("<div></div>").removeClass(".setBlank").addClass("blank");
    }
    $("#rack").append(tile);
    setDraggable($(tile));
  });
  //trigger draggable "stop" in order to update game's state
  repaintBoard();
  $("#passPlay").text("Pass");
}

function pass(wasClicked = false, isSwap, isAI, legalClick) {
  if (legalClick === false) return;
  //if param = true ->
  //    add to passCount

  if (isSwap !== undefined) {
    history.push({
      isAI: isAI,
      score: { computerScore, playerScore },
      skip: { isSwap: isSwap },
    });
    generateTable(history);
  }

  if (wasClicked) {
    if (isAI) {
      toggleModal({
        executeClose: true,
      });
      toggleModal({
        modal: { class: "", content: "" },
        modalPlacer: { class: "modal-dialog-centered", content: "" },
        title: { class: "", content: "Opponent chose to pass" },
        body: { class: "d-none", content: "" },
        footer: { class: "d-none", content: "" },
        actionButton: { class: "", content: "" },
        timeout: 2250,
        executeClose: false,
      });
    }
    passCount++;
  }
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
    if (playersTurn) $("#board .tile").removeClass("pcPlay");

    playersTurn || debugging ? pcPlay() : (playersTurn = true);
  }, 250);
}

function prePass(wasClicked, isSwap, isAI, legalClick) {
  if (legalClick === false) return;
  toggleModal({
    modal: { class: "", content: "" },
    modalPlacer: { class: "modal-dialog-centered", content: "" },
    title: { class: "d-none", content: "" },
    body: { class: "", content: "Are you sure you want to pass?" },
    footer: { class: "", content: "" },
    actionButton: { class: "doPass", content: "Confirm" },
    timeout: 0,
    executeClose: false,
  });
  $(".doPass").click((e) => {
    e.stopImmediatePropagation();
    toggleModal({
      executeClose: true,
    });
    pass(wasClicked, isSwap, isAI, legalClick);
  });
}

function play(isAI = false) {
  if (!isValidMove.words && debugging) playersTurn = true;
  if (!isValidMove.words) {
    return toggleModal({
      modal: { class: "", content: "" },
      modalPlacer: { class: "modal-dialog-centered", content: "" },
      modalHeader: { class: "d-none", content: "" },
      title: { class: "", content: "" },
      body: {
        class: "text-center",
        content: `<div class="alert alert-danger" role="alert">${isValidMove.slice(4)}</div>`,
      },
      footer: { class: "justify-content-center", content: "" },
      actionButton: { class: "d-none", content: "" },
      timeout: 0,
      executeClose: false,
    });
  }

  if (isValidMove.hasOwnProperty("rivalRack")) {
    computerScore += isValidMove.pointTally;
    $("#pcScore").text(computerScore);
    history.push({
      isAI: true,
      word: isValidMove.bestWord,
      points: isValidMove.pointTally,
      score: { computerScore, playerScore },
      skip: false,
    });
    generateTable(history);
    // add and display pc's score
  } else {
    playersTurn = true;
  }
  if (playersTurn) {
    playerScore += isValidMove.pointTally;
    $("#playerScore").text(playerScore);
    history.push({
      isAI: false,
      word: isValidMove.bestWord,
      points: isValidMove.pointTally,
      score: { computerScore, playerScore },
      skip: false,
    });
    generateTable(history);
    //calculate and add points to "player"
  }

  wordsLogged = isValidMove.words; //adding to the words that have been played

  if (playersTurn && !isAI) {
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
        $(`#rack`).append(`
    <div data-drag=${++lettersUsed} class="tile hot">${letter}<div>${points ? points : ""}</div></div>
    `);
        setDraggable($(`[data-drag="${lettersUsed}"]`));
      }
    }

    if (!bag.length && (!$("#rack .tile").length || !rivalRack.length)) {
      return endGame();
    }

    $("#bagBtn").text(100 - lettersUsed);
    resetSortable();

    //disable drag on "hot" tiles, remove "hot" & "multiplier" class from ".column .hot" and call pass()
    $("#board .hot").draggable("destroy").removeClass("hot").parent().removeClass(["dw", "tw", "dl", "tl"]);
  } else {
    let wordUsed = isValidMove.bestWord;

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
      setTimeout(() => {
        toggleModal({
          modal: { class: "", content: "" },
          modalPlacer: { class: "", content: "" },
          title: { class: "text-primary", content: `Opponent played: <b>"${wordUsed}"</b>` },
          body: { class: "d-none", content: "" },
          footer: { class: "d-none", content: "" },
          actionButton: { class: "", content: "" },
          timeout: 2200,
          executeClose: false,
        });
      }, 1650);
      return endGame();
    }

    $("#bagBtn").text(100 - lettersUsed);
    //disable drag on "hot" tiles, remove "hot" & "multiplier" class from ".column .hot" and call pass()
    $("#board .hot").removeClass(["hot"]).parent().removeClass(["dw", "tw", "dl", "tl"]);

    setTimeout(() => {
      toggleModal({
        modal: { class: "", content: "" },
        modalPlacer: { class: "", content: "" },
        title: { class: "text-primary", content: `Opponent played: <b>"${wordUsed}"</b>` },
        body: { class: "d-none", content: "" },
        footer: { class: "d-none", content: "" },
        actionButton: { class: "", content: "" },
        timeout: 2200,
        executeClose: false,
      });
    }, 1650);
  }
  //set firstTurn & isValidMove to false
  if (firstTurn) firstTurn = false;
  isValidMove = false;

  $("#passPlay").text("Pass");
  pass();
}

function showBagContent() {
  toggleModal({
    executeClose: true,
  });
  toggleModal({
    modal: { class: "text-center", content: "" },
    modalPlacer: { class: "modal-dialog-centered", content: "" },
    modalHeader: { class: "d-none", content: "" },
    title: { class: "", content: `` },
    body: { class: "mh-100", content: generateRemainder(bag) },
    footer: { class: "justify-content-center", content: "" },
    actionButton: { class: "d-none", content: "" },
    timeout: 0,
    executeClose: false,
  });
  // list letters + blank and how many remain of each tile
}
function showScoreHistory() {
  toggleModal({
    executeClose: true,
  });
  toggleModal({
    modal: { class: "text-center", content: "" },
    modalPlacer: { class: "modal-dialog-centered", content: "" },
    modalHeader: { class: "d-none", content: "" },
    title: { class: "", content: `` },
    body: { class: "", content: generateTable(history) },
    footer: { class: "justify-content-center", content: "" },
    actionButton: { class: "d-none", content: "" },
    timeout: 0,
    executeClose: false,
  });
  $(".modal-body").scrollTop(function () {
    return this.scrollHeight;
  });
  //show list of moves. who played what and how many points were earned
}

function setModalOptions(backdrop, keyboard) {
  console.log("works");
  $("#modal").data("bs.modal")._config.backdrop = backdrop;
  $("#modal").data("bs.modal")._config.keyboard = keyboard;
}

function handleBlank(blank) {
  toggleModal({
    executeClose: true,
  });
  toggleModal({
    modal: { class: "text-center", content: "" },
    modalPlacer: { class: "modal-dialog-centered", content: "" },
    modalHeader: { class: "d-none", content: "" },
    title: { class: "", content: `` },
    body: { class: "mh-100", content: generateOptions() },
    footer: { class: "justify-content-center", content: "" },
    actionButton: { class: "d-none", content: "" },
    timeout: 0,
    executeClose: false,
  });
  setModalOptions("static", false);

  let addClick = () => {
    $("#closeModal")
      .off("click")
      .click((e) => {
        if (blank.text() !== "") return;
        zoomOut();
        blank.appendTo("#rack");
        repaintBoard();
        $("#closeModal").off("click");
        setModalOptions(true, true);
      });
  };
  $("#closeModal").off("click");

  addClick();

  $(".blankChoices").click(function (e) {
    e.stopImmediatePropagation();

    let letter = $(this).text().trim("").slice(0, 1);

    blank.html(`${letter}<div style="bottom: 12px; left: 32px; font-weight: bolder; font-size: small;">0</div>`);
    repaintBoard();
    blank.removeClass("blank");
    blank.addClass("setBlank");

    blank[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    toggleModal({
      executeClose: true,
    });

    $("#closeModal").removeClass("closeBtn");
    setModalOptions(true, true);
  });
}

$("#bagBtn").click(showBagContent);
$("#scoresBtn").click(showScoreHistory);
$("#mix").click(() => ($("#rack .tile").length > 1 ? mix() : undefined));
$("#swapRecall").click(() => ($("#swapRecall").text() == "Swap" ? swap() : recall()));
$("#passPlay").click(() => ($("#passPlay").text() === "Pass" ? prePass(true, false, false, playersTurn) : play()));
$("#startGame").click(rematch);
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

      if ($(this).hasClass("setBlank") && $(this).parent().attr("id") === "rack") {
        $(this).html("<div></div>").removeClass(".setBlank").addClass("blank");
      }

      if ($(this).hasClass("blank") && $(this).parent().hasClass("column")) handleBlank($(this));

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
