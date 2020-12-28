let timeout = setTimeout(() => {}, 0);

let $modal = $("#modal");
let $modalPlacer = $(".modal-dialog");
let $modalContent = $(".modal-content");
let $modalHeader = $(".modal-header");
let $title = $(".modal-title");
let $body = $(".modal-body");
let $footer = $(".modal-footer");
let $actionButton = $("#actionButton");

const defaults = {
  modal: { class: "", content: "" },
  modalPlacer: { class: "", content: "" },
  modalContent: { class: "", content: "" },
  modalHeader: { class: "", content: "" },
  title: { class: "", content: "" },
  body: { class: "", content: "" },
  footer: { class: "", content: "" },
  actionButton: { class: "", content: "" },
  timeout: 0,
  executeClose: false,
};

let contentWasSet = false;

function resetModal(options) {
  //   $modal.html("");
  $title.html("");
  $body.html("");
  //   $footer.html("");
  $actionButton.html("");

  if (!contentWasSet) {
    //   $modal.html("");
    $title.html(options?.title?.content);
    $body.html(options?.body?.content);
    //   $footer.html("");
    $actionButton.html(options?.actionButton?.content);

    $modal.attr("class", `modal ${options?.modal?.class}`);
    $modalPlacer.attr("class", `modal-dialog ${options?.modalPlacer?.class}`);
    $modalContent.attr("class", `modal-content ${options?.modalContent?.class}`);
    $modalHeader.attr("class", `modal-header ${options?.modalHeader?.class}`);
    $title.attr("class", `modal-title ${options?.title?.class}`);
    $body.attr("class", `modal-body ${options?.body?.class}`);
    $footer.attr("class", `modal-footer ${options?.footer?.class}`);
    $actionButton.attr("class", `btn btn-primary ${options?.actionButton?.class}`);
  } else {
    $modal.attr("class", "modal");
    $modalPlacer.attr("class", "modal-dialog");
    $modalContent.attr("class", "modal-content");
    $body.attr("class", "modal-body");
    $footer.attr("class", "modal-footer");
    $actionButton.attr("class", "btn btn-primary");
  }

  contentWasSet = true;
}

function displayModal(options) {
  resetModal(options);

  $("#modal").modal("show");

  if (options.timeout) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      //
      $("#modal").modal("hide");

      setTimeout(() => {
        resetModal(options);
        contentWasSet = false;
      }, 400);
      //
    }, options.timeout);
  }
  return;
}

export default function toggleModal(options = defaults) {
  contentWasSet = false;
  clearTimeout(timeout);

  if (options.executeClose) {
    contentWasSet = true;
    resetModal({ ...defaults, ...options });
    $("#modal").modal("hide");
    return;
  }

  return displayModal({ ...defaults, ...options });
}

// <div class="modal fade" id="modal" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
//   <div class="modal-dialog modal-dialog-centered" role="document">
//     <div class="modal-content">

//   //! <div class="modal-header">
//?         <h5 class="modal-title" id="modalLabel">
//           ...
//?         </h5>

//  ?       <button type="button" class="close" data-dismiss="modal" aria-label="Close">
//           <span aria-hidden="true">&times;</span>
//   ?      </button>

//!       </div>
//?
//    !   <div class="modal-body">...</div>
//?
//!       <div class="modal-footer">

//  ?       <button type="button" class="btn btn-secondary" data-dismiss="modal">
//           Close
//   ?      </button>

//    ?     <button id="actionButton" type="button" class="btn btn-primary"></button>

// !      </div>

//     </div>
//   </div>
// </div>
