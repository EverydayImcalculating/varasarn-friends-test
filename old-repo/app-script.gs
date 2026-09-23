// ฟังก์ชันส่งข้อมูลให้หน้าเว็บ (ความเร็วสูง + ซ่อนอีเมล)
function doGet(e) {
  try {
    var reqUser = (e && e.parameter && e.parameter.user) ? e.parameter.user : "";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ฟังก์ชันดึงเฉพาะข้อมูลที่มีจริง ไม่เอาแถวว่าง
    function getOptimizedData(sheetName, emailColIndex) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      if (lastRow < 1 || lastCol < 1) return [];
      
      // ดึงข้อมูลแค่แถวบนสุดถึงแถวสุดท้ายที่มีข้อความ (ข้ามแถวว่างทั้งหมด)
      var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      
      return data.map(function(row, index) {
        if (index === 0) return row; // ปล่อยหัวตารางไว้
        
        var rowEmail = row[emailColIndex] ? row[emailColIndex].toString() : "";
        // ถ้าไม่ใช่อีเมลของเราเอง ให้เซ็นเซอร์ทิ้ง
        if (rowEmail !== reqUser) {
          row[emailColIndex] = "***"; 
        }
        return row;
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      courses: getOptimizedData("Courses", 3), // อีเมลผู้สร้างวิชา อยู่คอลัมน์ที่ 4 (index 3)
      reviews: getOptimizedData("Reviews", 11) // อีเมลผู้รีวิว อยู่คอลัมน์ที่ 12 (index 11)
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error", message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ฟังก์ชันรับข้อมูลจากหน้าเว็บ (รับ-แก้ไข-ลบ) เหมือนเดิม
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var userEmail = payload.userEmail || "";
    
    if (action === "addCourse") {
      var sheet = ss.getSheetByName("Courses");
      sheet.appendRow([payload.courseCode, payload.courseName, payload.category, userEmail]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "updateCourse") {
      var sheet = ss.getSheetByName("Courses");
      sheet.getRange(payload.rowIndex, 1, 1, 4).setValues([[payload.courseCode, payload.courseName, payload.category, userEmail]]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "addReview") {
      var sheet = ss.getSheetByName("Reviews");
      sheet.appendRow([new Date(), payload.courseCode, payload.rating, payload.reviewText, payload.semester, payload.year, payload.teacher, payload.sec, payload.day, payload.start, payload.end, userEmail]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "updateReview") {
      var sheet = ss.getSheetByName("Reviews");
      sheet.getRange(payload.rowIndex, 1, 1, 12).setValues([[new Date(), payload.courseCode, payload.rating, payload.reviewText, payload.semester, payload.year, payload.teacher, payload.sec, payload.day, payload.start, payload.end, userEmail]]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === "deleteData") {
      var sheet = ss.getSheetByName(payload.sheetName);
      sheet.deleteRow(payload.rowIndex);
      return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

