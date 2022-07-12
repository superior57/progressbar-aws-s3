// -----
function elt(type, prop, ...childrens) {
  let elem = document.createElement(type);
  if (prop) Object.assign(elem, prop);
  for (let child of childrens) {
    if (typeof child == "string")
      elem.appendChild(document.createTextNode(child));
    else elem.appendChild(elem);
  }
  return elem;
}

//Progress class
class Progress {
  constructor(now, min, max, options) {
    this.dom = elt("div", {
      className: "file-upload-progress-bar",
    });
    this.min = min;
    this.max = max;
    this.now = now;
    this.syncState();
    if (options.parent) {
      document.querySelector(options.parent).appendChild(this.dom);
      this.label = document
        .querySelector(options.parent)
        .querySelector(".file-upload-progress-label");
      document.querySelector(options.parent).style.display = "block";
    } else document.body.appendChild(this.dom);
  }

  syncState() {
    this.dom.style.width = this.now + "%";
    if (this.label) {
      this.label.textContent = this.now + "%";
      if (this.now > 50) {
        this.label.style.color = 'white';        
      }
      if (this.now === this.max) {
        this.label.textContent = "Done!";        
      } 
    }
  }
}

// --- main func

(function () {
  // getElementById
  function $id(id) {
    return document.getElementById(id);
  }

  // output information
  function clearMsg() {
    var m = $id("messages");
    m.innerHTML = "";
  }
  // output information
  function Output(msg) {
    var m = $id("messages");
    m.innerHTML = msg + m.innerHTML;
  }

  // file drag hover
  function FileDragHover(e) {
    e.stopPropagation();
    e.preventDefault();
    var h = e.target.classList;
    //debugger;
    if (
      !e.target.classList.contains("material-icons") &&
      !e.target.classList.contains("u-btn")
    )
      e.target.className = e.type == "dragover" ? "hover" : "";
  }

  // file selection
  function FileSelectHandler(e) {
    // cancel event and hover styling
    FileDragHover(e);

    // fetch FileList object
    var files = e.target.files || e.dataTransfer.files;
    var uploadbutton = $id("upload-button");

    var fileChooser = $id("fileselect");
    fileChooser.files = files;

    if (files && files.length > 0) uploadbutton.disabled = false;
    else uploadbutton.disabled = true;

    clearMsg();
    if (files.length > 1)
      Output(
        '<span style="text-aling:center;">At this time we only support uploading one file per transaction. After this file uploads you may return to this page to upload another</span>'
      );

    if (files.length > 0) ParseFile(files[0]);

    // process all File objects
    //for (var i = 0, f; f = files[i]; i++) {
    //	ParseFile(f);
    //}
  }

  // output file information
  function ParseFile(file) {
    Output(
      "<p>File Name: <strong>" +
        file.name +
        //"</strong> type: <strong>" + file.type +
        //"</strong> size: <strong>" + file.size +
        //"</strong> bytes</p>"
        "</strong></p>"
    );
  }

  // initialize
  function Init() {
    var fileselect = $id("fileselect"),
      filedrag = $id("filedrag");
    // file select
    fileselect.addEventListener("change", FileSelectHandler, false);

    // is XHR2 available?
    var xhr = new XMLHttpRequest();
    if (xhr.upload) {
      // file drop
      filedrag.addEventListener("dragover", FileDragHover, false);
      filedrag.addEventListener("dragleave", FileDragHover, false);
      filedrag.addEventListener("drop", FileSelectHandler, false);
      filedrag.style.display = "block";
    }
  }

  // call initialization file
  if (window.File && window.FileList && window.FileReader) {
    Init();
  }

  AWS.config.region = "us-west-2";
  var cognitoIdentityPoolId = "us-west-2:a6805b00-680c-4dae-82e8-b669aec34256";

  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: cognitoIdentityPoolId,
  });

  AWS.config.credentials.get(function (err) {
    if (err) alert(err);
    console.log(AWS.config.credentials);
  });

  var bucketName = "file-dropzone";
  var bucket = new AWS.S3({
    params: {
      Bucket: bucketName,
    },
  });

  var fileChooser = document.getElementById("fileselect");
  var button = document.getElementById("upload-button");

  button.addEventListener(
    "click",
    function () {
      var file = fileChooser.files[0];

      if (file) {
        var loadingSpinner = $id("loading-spinner");
        loadingSpinner.style.display = "block";
        var d = new Date();
        var objKey =
          "thelai.com/" + d.toISOString().substring(0, 10) + "/" + file.name;
        var params = {
          Key: objKey,
          ContentType: file.type,
          Body: file,
          ACL: "public-read",
        };
        let pb = new Progress(0, 0, 100, { parent: ".file-upload-progress" });

        bucket
          .putObject(params, function (err, data) {
            debugger;
            if (err) {
              console.log(err);
              debugger;
            }
            window.location.replace(
              "https://s3.amazonaws.com/thelai.com/dropzone/success.html"
            );
          })
          .on("httpUploadProgress", function (progress) {
            let progressPercentage = Math.round(
              (progress.loaded / progress.total) * 100
            );

            pb.now = progressPercentage;
            pb.syncState();
          });
      } else {
      }
    },
    false
  );
})();
