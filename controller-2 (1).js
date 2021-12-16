/* Functionality */
var deviceNames = [];
var selectedDevice = {};
var connectionStatus = {};
var charData = {};
var charCommand = {};
var timeBuffer = {};
var accXBuffer = {};
var accYBuffer = {};
var accZBuffer = {};
var gyroXBuffer = {};
var gyroYBuffer = {};
var gyroZBuffer = {};

var accCsv = [];
var gyroCsv = [];

// Tabs
var TAB_START = 0;
var TAB_RATE = 1;
var TAB_STREAM = 2;

// Commands
var SUBSCRIBE = 1;
var UNSUBSCRIBE = 2;

// Responses
var COMMAND_RESULT = 1;
var DATA = 2;

// References
var IMUDATA_REFERENCE = 99;

// Data rate
var rate = null;
var cnt = null;

// Features
var thresholdAccX = 0;
var loopIndices = [];
var rangeAccX = [];
var rangeAccY = [];



var startTime = 0;
var endTime = 0;
var totalTime = 0;
var flagRecord = false;
var endTimeSet = false;
var startTimeSet = false;
var accTotal = 0.0;
var counter = 0;
var randomNumber = 0;

function positionDetectandPrint(accX, accY, accZ, gyroX, gyroY, gyroZ, timestamp){
  if(accY > 5){
    return;
  }
  if(gyroX > 180){
    return;
  }
  
  if(gyroX > 30 && accY > 1 && !startTimeSet){ // need to double check this 80 threshold
    flagRecord = true;
    startTime = timestamp;
    startTimeSet = true;
    endTimeSet = false;
    var randNum = getRandomInt(3) ;
    randomNumber = randNum;
  }
  else if((gyroX < - 50 || startTime != 0 || accY < 1) && startTimeSet && !endTimeSet){
    startTimeSet = false;
    endTimeSet == true;
    endTime = timestamp;
    //var presentTime = endTime - startTime;
    if((endTime - startTime)/1000 < 15 || (endTime - startTime)/1000 > 2){
      totalTime += endTime - startTime;
    }
    
  }

  // total amount drank 
  //var waterDrank = totalTime
  //6.0 * (accTotal / counter) * totalTime / 10.0
//" Start time: " +  startTime + " End time: " + endTime + " total time: " + totalTime
  if(accY > 1 && flagRecord){
    accTotal += accY;
    counter = counter + 1;
    document.getElementById("note").innerText = "Water drinking in progress";

  }else{
    flagRecord = false;
    if(counter == 0){
        document.getElementById("note").innerText =  "No water drank today, start drinking water now and complete your 4000ml daily hydration goal!";
    }else{ 
    var t = (accTotal / counter) * totalTime * 6.0/100.0;
    t = t.toFixed(0);
    
    if(t < 2000){
      if(randomNumber == 0){
        document.getElementById("note").innerText =  "Let's get started! You drank " +  t + "ml today. That is "+ (t/40).toFixed(0) + " % done to reach 4000ml daily hydration goal. ";
      }
      else if(randomNumber == 1){
        document.getElementById("note").innerText =  "Hiii just texting to remind you of your water bottle. You drank " +  t + "ml today. That is "+ (t/40).toFixed(0) + " % done to reach 4000ml daily hydration goal. ";
      }else{
        document.getElementById("note").innerText =  "Don't forget to stay hydrated! You drank " +  t + "ml today. That is "+ (t/40).toFixed(0) + " % done to reach 4000ml daily hydration goal. Don't forget to stay hydrated! ";
      }
    }
    else if(t < 3000){
      if(randomNumber == 0){
      document.getElementById("note").innerText =  "Keep up the good work! So far you drank " +  t + "ml today, you are "+ (t/40).toFixed(0) + " % done to reach 4000ml daily hydration goal. ";
      }
      else if(randomNumber == 1){
      document.getElementById("note").innerText =  "You are more than halfway done! You drank " +  t + "ml today, you are "+ (t/40).toFixed(0) + " % done to reach 4000ml daily hydration goal. ";
      }else{
      document.getElementById("note").innerText =  "You are on track! So far you drank " +  t + "ml today, you are "+ (t/40).toFixed(0) + " % done to reach 4000ml daily hydration goal. ";
      }
    
    
    }else if(t <= 4000 ){
      if(randomNumber == 0){
        document.getElementById("note").innerText =  "Great job! You drank " +  t + "ml today, you are "+ (t/40).toFixed(0) + " % done to reach 4000ml daily hydration goal. Almost there!! ";
      }
        else if(randomNumber == 1){
        document.getElementById("note").innerText =  "Sooo close! You drank " +  t + "ml today, you are "+ (t/40).toFixed(0) + " % done to reach 4000ml daily hydration goal. ";
        }else{
        document.getElementById("note").innerText =  "Keep on being amazing! You drank " +  t + "ml today, you are "+ (t/40).toFixed(0) + " % done to reach 4000ml daily hydration goal. Literally almost there!! ";
        }


    }else{
      document.getElementById("note").innerText =  "Wow, you drank " +  t + "ml today, you are exceeding your goal by "+ (t/40).toFixed(0) + " You are amazing! ";

    }
  }
}
  // document.getElementById("note").innerText = "No water drinking detected";

}


function disconnect_sensor() {

  let name = deviceNames[deviceNames.length - 1];
  let device = selectedDevice[name];
  selectedDevice[name] = null;
  if (device) {
    device.gatt.disconnect();
  }
  connectionStatus[name] = false;

  clearData();
  jumpTab(TAB_START); // Go back to the first tab
}

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(max){
  return Math.floor(Math.random() * max);
}

function onDeviceDisconnected(event) {
  let device = event.target;
  console.log('Device ' + device.name + ' is disconnected.');
  alert(device.name + " disconnected");
  
  clearData();
  jumpTab(TAB_START); // Go back to the first tab

  // If a device with wrong characteristics is disconnected
  if (!(Object.keys(selectedDevice).includes(device.name))) {
    return;
  }

  charData[device.name] = null;
  charCommand[device.name] = null;


  if (selectedDevice[device.name] != null) {
    connectionStatus[device.name] = false;
    connect_sensor(device.name);
    alert("Connection lost, reconnecting...");
  }
  else {
    delete charData[device.name];
    delete connectionStatus[device.name];
    delete charCommand[device.name];
    delete selectedDevice[device.name];

    var index = deviceNames.indexOf(device.name);
    deviceNames.splice(index, 1);
    console.log(deviceNames);
    if (deviceNames.length != 0) {
      // Disconnected by accident
      // Call disconnect_sensor until all the sensors are disconnected
      disconnect_sensor();
    }
  }
}

// Update a subplot with new batch of data.
async function updatePlot(bt, accXB, accYB, accZB, gyroXB, gyroYB, gyroZB, dev) {

  let graphIndex = deviceNames.indexOf(dev);
  let indices = []
  let ts = []
  for (i = graphIndex; i < graphIndex + 6; i++) {
    indices.push(i);
    ts.push(bt);
  }

  Plotly.extendTraces('graph', {
    x: ts,
    y: [accXB, accYB, accZB, gyroXB, gyroYB, gyroZB]
  }, indices);
}


function handleNotifications(event) {
  let value = event.target.value;
  var uint8View = new Uint8Array(value.buffer);

  //console.log("incoming data: ", uint8View);
  /*for(i=0; i<uint8View.byteLength;i++)
   {
   console.log("#" + i +": " + uint8View[i].toString(16));
   }*/

  let device = event.target.service.device.name;
  let response = uint8View[0];
  let reference = uint8View[1];
  if (response == COMMAND_RESULT && reference == IMUDATA_REFERENCE) {
    let resultCode = (new Uint16Array(value))[1]; // bytes 2&3
    console.log("IMU subscribe result: ", resultCode);
  }
  if (response == DATA && reference == IMUDATA_REFERENCE) {

    // Acc bin format:
    // - timestamp [uint32]
    // - [{x,y,z}...{x,y,z}] // array of 3dvectors of float32 values (12 bytes each)

    //Timestamp at 2(cmd + reference) bytes (little endian=true)
    let timestamp = value.getUint32(2, true);
    // console.log("timestamp: " + timestamp);

    // Exclude 6 bytes: Float32 vectors start at 2(cmd + reference) + 4 (timestamp) bytes
    // IMU9 includes 36 = 3 (Acc, Gyro and Magn) arrays * 3 (x/y/z) axes * 4 bytes
    // http://www.movesense.com/docs/esw/api_reference/
    let numOfSamples = (value.byteLength - 6) / 36;
    for (i = 0; i < numOfSamples; i++) {
      let accX = value.getFloat32(6 + i * 12, true);
      let accY = value.getFloat32(6 + i * 12 + 4, true);
      let accZ = value.getFloat32(6 + i * 12 + 8, true);

      // 2(cmd + reference) + 4 (timestamp) + 3 (x/y/z) axes * 4 bytes = 18 bytes
      let gyroX = value.getFloat32(6 + (i + numOfSamples) * 12, true);
      let gyroY = value.getFloat32(6 + (i + numOfSamples) * 12 + 4, true);
      let gyroZ = value.getFloat32(6 + (i + numOfSamples) * 12 + 8, true);

      // console.log("x,y,z: " + x + ", " + y + ", " + z);
      timeBuffer[device].push(timestamp / 1000.0 + (1.0 * i) / parseFloat(rate));
      accXBuffer[device].push(accX);
      accYBuffer[device].push(accY);
      accZBuffer[device].push(accZ);
      gyroXBuffer[device].push(gyroX);
      gyroYBuffer[device].push(gyroY);
      gyroZBuffer[device].push(gyroZ);


      
      // call my function
      positionDetectandPrint(accX, accY, accZ, gyroX, gyroY, gyroZ, timestamp);


      accCsv.push([timestamp, accX, accY, accZ]);
      gyroCsv.push([timestamp, gyroX, gyroY, gyroZ]);

      if (timeBuffer[device].length > cnt) {
        let bt = timeBuffer[device];
        let accXB = accXBuffer[device];
        let accYB = accYBuffer[device];
        let accZB = accZBuffer[device];
        let gyroXB = gyroXBuffer[device];
        let gyroYB = gyroYBuffer[device];
        let gyroZB = gyroZBuffer[device];

        updatePlot(bt, accXB, accYB, accZB, gyroXB, gyroYB, gyroZB, device);
        timeBuffer[device] = [];
        accXBuffer[device] = [];
        accYBuffer[device] = [];
        accZBuffer[device] = [];
        gyroXBuffer[device] = [];
        gyroYBuffer[device] = [];
        gyroZBuffer[device] = [];
      }
    }
  }
}




// Ref: https://www.freakyjolly.com/multipage-canvas-pdf-using-jspdf/
function download_pdf() {
  var HTML_Width = $(".html-content").width();
  var HTML_Height = $(".html-content").height();
  var top_left_margin = 15;
  var PDF_Width = HTML_Width + (top_left_margin * 2);
  var PDF_Height = (PDF_Width * 1.5) + (top_left_margin * 2);
  var canvas_image_width = HTML_Width;
  var canvas_image_height = HTML_Height;

  var totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;

  html2canvas($(".html-content")[0]).then(function (canvas) {
    var imgData = canvas.toDataURL("image/jpeg", 1.0);
    var pdf = new jsPDF('p', 'pt', [PDF_Width, PDF_Height]);
    pdf.addImage(imgData, 'JPG', top_left_margin, top_left_margin, canvas_image_width, canvas_image_height);
    for (var i = 1; i <= totalPDFPages; i++) {
      pdf.addPage(PDF_Width, PDF_Height);
      pdf.addImage(imgData, 'JPG', top_left_margin, -(PDF_Height * i) + (top_left_margin * 4), canvas_image_width, canvas_image_height);
    }
    pdf.save("SensorData.pdf");
  });
}

function download_raw() {
  var header = 'Timestamp,Acc_X, Acc_Y, Acc_Z';
  let time = new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
  download_csv(header, accCsv, time + '_acc_stream.csv');

  header = 'Timestamp,Gyro_X, Gyro_Y, Gyro_Z';
  download_csv(header, gyroCsv, time + '_gyro_stream.csv');
}

// Ref: https://code-maven.com/create-and-download-csv-with-javascript
function download_csv(header, data, fileName) {
  var csv = header + '\n';
  console.log('Download raw sensor data with header: ' + csv);
  data.forEach(function (row) {
    csv += row.join(',');
    csv += "\n";
  });

  var hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  hiddenElement.target = '_blank';
  hiddenElement.download = fileName;
  hiddenElement.click();
}

function addGraph() {
  var data = [];
  data = addAxes(data, "Acc", 3, ["green", "blue", "red"], 1, 1);
  data = addAxes(data, "Gyro", 3, ["orange", "purple", "pink"], 1, 2);

  var layout = {
    title: "Accelerometer and Gyroscope",
    autosize: true,
	useResizeHandler: true,
    xaxis: {
      title: "Time[s]",
    },
    yaxis: {
      title: "Accelerometer[m/s^2]"
    },
    yaxis2: {
      title: "Gyroscope[dps]"
    },
    grid: { rows: 2, columns: 1, subplots: [['xy'], ['xy2']] }
  };

  Plotly.newPlot('graph', data, layout);

}

function addAxes(data, sensorType, axisNum, lineColors, x, y) {
  let axisNames = ["x", "y", "z"];
  for (var j = 0; j < axisNum; j++) {
    var trace = {
      x: [],
      y: [],
      xaxis: "x" + x,
      yaxis: "y" + y,
      name: sensorType + " " + axisNames[j],
      mode: 'lines',
      line: { color: lineColors[j] }
    };
    data.push(trace);
  }
  return data;
}

function subscribe_data() {

  // Read the sample rate and decide how often the plot is updated
  rate = document.getElementById("sampleRate").value;
  cnt = parseInt(rate) / 5;
  let dataResource = "/Meas/IMU9/" + rate;

  let subscribeImuCmd = new Uint8Array([SUBSCRIBE, IMUDATA_REFERENCE]);
  let subscribeRes = new Uint8Array(new TextEncoder().encode(dataResource));
  let fullCommand = new Uint8Array(subscribeImuCmd.length + subscribeRes.length);
  fullCommand.set(subscribeImuCmd);
  fullCommand.set(subscribeRes, subscribeImuCmd.length);

  loopIndices = [];
  lastRangeAccX = [];
  lastRangeAccY = [];
  jumpTab(TAB_STREAM);
  addGraph();

  deviceNames.forEach(function (it) {

    if (charCommand[it] == null || charData[it] == null)
      return;

    timeBuffer[it] = [];
    accXBuffer[it] = [];
    accYBuffer[it] = [];
    accZBuffer[it] = [];
    gyroXBuffer[it] = [];
    gyroYBuffer[it] = [];
    gyroZBuffer[it] = [];

    console.log("full command: ", fullCommand);
    charCommand[it].writeValue(fullCommand)
      .then(() => {
        console.log("Data SUBSCRIBE sent");
        $('#selectDevice').css('visibility', 'hidden');
        $('#disconnect').css('visibility', 'hidden');
      });
  });
}

function unsubscribe_data() {
  // Hide the "End" button
  document.getElementById("unsubdata").style.display = "none";
  var buttons = document.getElementsByClassName("evenBtns");
  for (const btn of buttons){
    btn.style.display = "flex";
  }

  deviceNames.forEach(function (it) {
    if (charCommand[it] == null || charData[it] == null)
      return;

    let unsubscribeCmd = new Uint8Array([UNSUBSCRIBE, IMUDATA_REFERENCE]);

    console.log("unsubscribeCmd command: ", unsubscribeCmd);
    charCommand[it].writeValue(unsubscribeCmd)
      .then(() => {
        console.log("Data UNSUBSCRIBE sent");
        $('#selectDevice').css('visibility', 'visible');
        $('#disconnect').css('visibility', 'visible');
      });
  });
}

function showFeedback(msg, secs) {
  var feedback = document.getElementById("feedback");
  feedback.innerHTML = msg;
  setTimeout(function () {
    feedback.style.display = "none";
  }, secs);
  feedback.style.display = "flex";
}

function select_sensor() {
  navigator.bluetooth.requestDevice({
    filters: [{
      namePrefix: ['Movesense'] // 175130000985
    }],
    optionalServices: ['34802252-7185-4d5d-b431-630e7050e8f0'], // sensordata-service
  }).
    then(device => {
      deviceNames.push(device.name);
      connectionStatus[device.name] = false;
      selectedDevice[device.name] = device;
      charData[device.name] = null;
      charCommand[device.name] = null;
      console.log("Device " + deviceNames + " selected.");
      return connect_sensor(device.name);
    })
    .catch(error => {
      console.log("select_sensor error: ", error.toString());
      // TODO: replace this with a proper handler
      if (!(error.toString().includes("cancelled"))) {
        pop_device();
      }
    });
}

function set_mode(m) {
  mode = m;
  var selected = document.getElementById("mode");
  selected.options[mode].selected = true;
  jumpTab(TAB_RATE);
}

function new_session() {
  clearData();
  jumpTab(TAB_RATE);
}

function clearData() {
  loopIndices = [];
  rangeAccX = [];
  rangeAccY = [];
  accCsv = [];
  gyroCsv = [];
  document.getElementById("note").innerText = "You may edit the note here ...";

  // Show the "End" button
  document.getElementById("unsubdata").style.display = "";
  var buttons = document.getElementsByClassName("evenBtns");
  for (const btn of buttons){
    btn.style.display = "none";
  }
}

// Remove device with wrong characteristics 
function pop_device() {
  let name = deviceNames.pop();
  let tmp = selectedDevice[name];
  delete charData[name];
  delete connectionStatus[name];
  delete charCommand[name];
  delete selectedDevice[name];
  tmp.gatt.disconnect();
}


function connect_sensor(name) {
  return new Promise(function (resolve, reject) {
    selectedDevice[name].addEventListener('gattserverdisconnected', onDeviceDisconnected);
    selectedDevice[name].gatt.connect()
      .then(server => {
        console.log("server: ", server);
        return server.getPrimaryService('34802252-7185-4d5d-b431-630e7050e8f0');
      })
      .then(service => {
        console.log('Getting Characteristics...');
        // Get all characteristics.

        return service.getCharacteristics();
      })
      .then(characteristics => {
        console.log(characteristics);
        console.log('> Characteristics: ' +
          characteristics.map(c => c.uuid).join('\n' + ' '.repeat(19)));


        for (i = 0; i < characteristics.length; i++) {
          let char = characteristics[i];
          if (char.uuid.length >= 36) {
            let uuid16 = char.uuid.slice(4, 8);
            if (uuid16 == '0001') {
              console.log("charCommand: ", uuid16);

              charCommand[name] = char;
            }
            else if (uuid16 == '0002') {
              console.log("charData: ", uuid16);
              charData[name] = char;
            }
          }
        }

        return charData[name].startNotifications();
      })
      .then(_ => {
        console.log('> Notifications started');
        charData[name].addEventListener('characteristicvaluechanged',
          handleNotifications);
      })
      .then(() => {
        console.log("Connected");
        connectionStatus[name] = true;
        jumpTab(TAB_RATE); // Move on to the next tab
        resolve(name);
      })
      .catch(error => {
        console.log("BLE error: ", error.toString());
        reject(error);
      });
  });
}

/* Style */
function showTab(n) {
  // This function will display the specified tab of the form...
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "block";
}

function jumpTab(n) {
  // Exit the function if the desired tab is already the current one
  if (currentTab == n) return false;

  // This function will figure out which tab to display
  var x = document.getElementsByClassName("tab");
  // Exit the function if any field in the current tab is invalid:
  if (n > currentTab && !validateForm(n)) return false;

  // Hide the current tab:
  x[currentTab].style.display = "none";
  // Increase or decrease the current tab by 1:
  currentTab = n;
  // if you have reached the end of the form...
  if (currentTab >= x.length) {
    // ... the form gets submitted:
    document.getElementById("form").submit();
    return false;
  }
  // Otherwise, display the correct tab:
  showTab(currentTab);
}

function validateForm(targetTab) {
  // This function deals with validation
  let name = deviceNames[deviceNames.length - 1];
  // Sensor must be connected before going to other tabs
  if (targetTab > TAB_START && !connectionStatus[name]) {
    return false; // return the valid status
  }
  return true;
}