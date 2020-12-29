function generateRack(rack) {
  let tiles = rack.map((x) => {
    return { letter: x.innerText[0] ? x.innerText[0] : "", points: +x.innerText.slice(2) };
  });

  let modalContent = `
  <h5 class="mb-3">Swap Tiles</h5>
  <h6>Select the tiles you want to exchange</h6>
  <small >(click a second time to undo)</small>
  <div class="mt-2 rackCopy">`;
  tiles.forEach((x, i) => {
    modalContent += `<div class="tile selectTile">${x.letter ? x.letter : ""}<div>${
      x.points ? x.points : ""
    }</div></div>`;
  });

  modalContent += `</div>`;
  return modalContent;
}

function doSwap(bag, rack) {
  let dataDragArr = $("#rack .tile")
    .toArray()
    .map((x) => x.dataset.drag);

  let remainingRack = rack
    .filter((x) => {
      return !x.className.includes("selected");
    })
    .map((x) => {
      return { letter: x.innerText[0] ? x.innerText[0] : "", points: +x.innerText.slice(2) };
    });

  let tilesToSwap = rack
    .filter((x) => {
      return x.className.includes("selected");
    })
    .map((x) => {
      return { letter: x.innerText[0] ? x.innerText[0] : "", points: +x.innerText.slice(2) };
    });

  for (let i = 0; i < tilesToSwap.length; i++) {
    if (bag.length) {
      remainingRack.push(_.pullAt(bag, [0])[0]);
    }
  }

  bag.push(...tilesToSwap);
  bag = _.shuffle(_.shuffle(bag));

  let newRack = remainingRack.map((x, i) => {
    return { ...x, drag: +dataDragArr[i] };
  });

  return { newBag: bag, newRack };
}

export { generateRack, doSwap };
