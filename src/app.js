const fitDecoder = require("fit-decoder");
const { buildGPX, BaseBuilder } = require("gpx-builder");
const { Point } = BaseBuilder.MODELS;
const JSZip = require("jszip");
const FileSaver = require("file-saver");

function init() {
  const fileSelector = document.getElementById("file-selector");
  fileSelector.addEventListener("change", (event) =>
    onFilesChange([...event.target.files])
  );
}

async function onFilesChange(fileList) {
  const gpxListPromises = fileList.map(async (file) => {
    const name = file.name;
    const fileBuffer = await readFile(file);
    const jsonRaw = fitDecoder.fit2json(fileBuffer);
    const json = fitDecoder.parseRecords(jsonRaw);
    const gpxData = new BaseBuilder();
    const segmentPoints = json.records
      .filter(
        (record) =>
          record.data.position_lat !== undefined &&
          record.data.position_long !== undefined &&
          record.data.timestamp !== undefined
      )
      .map(
        (record) =>
          new Point(record.data.position_lat, record.data.position_long, {
            time: record.data.timestamp,
          })
      );
    gpxData.setSegmentPoints(segmentPoints);
    const content = buildGPX(gpxData.toObject());
    return {
      name,
      content,
    };
  });
  const gpxList = await Promise.all(gpxListPromises);
  console.log(gpxList);
  exportGpxList(gpxList);
}

async function exportGpxList(gpxList) {
  // Make zip
  var zip = new JSZip();
  const gpxFolder = zip.folder("gpx");
  gpxList.forEach((gpxItem) =>
    gpxFolder.file(`${gpxItem.name}.gpx`, gpxItem.content)
  );

  // Export
  const blob = await zip.generateAsync({ type: "blob" });
  FileSaver.saveAs(blob, "gpx.zip");
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("loadend", (event) => {
      resolve(reader.result);
    });
    reader.readAsArrayBuffer(file);
  });
}

init();
