const rangeValues = {
  1: { text: "Easy - good if you're just starting out.", class: "font-weight-bolder text-success" },
  2: { text: "Normal", class: "font-weight-bolder text-primary" },
  3: { text: "Hard - you want a challenge", class: "font-weight-bolder text-danger" },
  4: { text: "<u>Insane - All Gas No Breaks!!</u>", class: "font-weight-bolder text-danger" },
};

function convertVal(val) {
  let convertedVal = val < 28 ? 1 : val < 46 ? 2 : val < 60 ? 3 : 4;

  return convertedVal;
}

function giveFeedBack() {
  $("#difficulty").on("input change", function () {
    let value = $(this).val();
    $("#difficultyText").html(rangeValues[convertVal(value)].text).attr("class", rangeValues[convertVal(value)].class);
    $("#difficultyPercentage")
      .html(((value - 15) * 100) / (65 - 15) + "%")
      .attr("class", rangeValues[convertVal(value)].class);
  });
}

function generateSettings() {
  let hints = JSON.parse(localStorage.getItem("hints")) || { show: true };
  let value = +localStorage.getItem("difficulty") || 15;
  let modalContent = `
    <h5 class="mb-3">Settings</h5>
    <h6>Current difficulty:</h6>`;

  modalContent += `<div>
    <label id="difficultyText" for="difficulty"></label>
    <input type="range" class="custom-range" min="15" max="65" step="1" id="difficulty" value="${value}">
    <div id="difficultyPercentage" class="${rangeValues[convertVal(value)].class}">${
    ((value - 15) * 100) / (65 - 15)
  }%</div>
  <hr class="bg-dark w-50 mx-auto" />
  <label id="hints" for="showHints">Show hints: </label>
    <input type="checkbox" id="showHints" ${hints.show ? "checked" : ""}>
    </div>`;

  return modalContent;
}

export { generateSettings, giveFeedBack, rangeValues, convertVal };
