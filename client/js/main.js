import letters from "./scrabbleLetters.js";
import { getWordTrieStr, getPossibleWords, getWordValues } from "./getRequests.js";
import gridState from "./createGrid.js";

let lettersUsed = 0;

const bag = _.shuffle(_.shuffle(letters));
let rivalRack = [];

// console.log(JSON.stringify(gridState));
console.log(gridState);

getWordTrieStr();

getWordValues();

function startGame() {
  // $('#rack').empty();
  for (let i = 0; i < 7; i++) {
    let { letter, points } = _.pullAt(bag, [0])[0];
    console.log(letter, points);
    $(`#rack`).append(`
        <div data-drag=${i} class="tile">${letter}<div>${points ? points : ""}</div></div>
        `);
    setDraggable($(`[data-drag="${i}"]`));
  }
  for (let i = 0; i < 7; i++) {
    rivalRack.push(_.pullAt(bag, [0])[0]);
    console.log(rivalRack);
  }
  lettersUsed = 14;
  $("#startGame").attr("disabled", "disabled");
  resetSortable();
}

$("#startGame").click(startGame);

function setDraggable(x) {
  x.draggable({
    connectToSortable: "#rack",
    revert: "invalid",
    start: function (event, ui) {
      ui.helper.data("rejected", false);
      ui.helper.data("original-position", ui.helper.offset());
    },
    stop: function (event, ui) {
      if (ui && ui.helper)
        if (ui.helper.data("rejected") === true) {
          ui.helper.offset(ui.helper.data("original-position"));
        }
      console.count(); //repaint Game/Grid State here
    },
  });
}

function resetSortable() {
  $("#rack").sortable({
    placeholder: "ph-class",
    scroll: false,
    revert: 200,
    receive: function (event, ui) {
      $(ui.item)
        .css({
          height: "45px",
          width: "42px",
          "font-size": "x-large",
          "z-index": "11",
        })
        .children("div")
        .css({
          left: "29px",
          bottom: "6px",
          "font-weight": "bolder",
        });
    },
  });
  $("#rack").disableSelection();
}

$(".column").droppable({
  accept: ".tile",
  tolerance: "intersect",
  drop: function (ev, ui) {
    if ($(this).children(".tile").length > 0) {
      ui.helper.data("rejected", true);
      return false;
    }

    let tileClone = $(ui.draggable).clone().detach();
    $(this).prepend(tileClone);

    $(ui.draggable).remove();
    setTimeout(function () {
      $(ui.draggable).remove();
    }, 5);

    tileClone.draggable({
      connectToSortable: "#rack",
    });

    setDraggable(tileClone);
    $(tileClone)
      .css({
        position: "relative",
        left: "0",
        top: "0",
        height: "25.5px",
        width: "25.5px",
        "font-size": "15px",
        "z-index": "11",
      })
      .children("div")
      .css({
        left: "15px",
        bottom: "10px",
        "font-weight": "600",
        padding: "1px",
      });

    $(".tile").each((i) => {
      if ($(`[data-drag="${i}"]`).length > 1) {
        $(`[data-drag="${i}"]`)[0].remove();
      }
    });
  },
});
