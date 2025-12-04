class Observer {
  notify(message) {
    console.log(`Observer --> ${message}`); //when there is a notification/update, the observer prints out a message in console
  }
}

class Assignment {
  constructor(assignmentName, status = "not assigned") { //constructor has assignmnent name and status as info passed through. Status as "not assigned" for default status
    this.assignmentName = assignmentName; //sets the assignment name
    this.status = status; //sets the default status
    this._grade = null; //sets grade to null since no grades have been set yet
  }

  setGrade(grade) {           //grade is accessible through the setGrade method 
    this._grade = grade;
    this.status = grade > 50 ? "passed" : "failed"; //sets the status of grade depending on higher or lower than 50
  }
}

class Student {
  constructor(fullName, email, observer) { //constructor includes all the required parameters/info on the student
    this.fullName = fullName;
    this.email = email;
    this.assignmentStatuses = []; //array of statuses for the array of assignments
    this.overallGrade = null;
    this.observer = observer;
    this._workTimers = {};
  }

  setFullName(name) { //setter method for name
    this.fullName = name;
  }

  setEmail(email) { //setter method for email
    this.email = email;
  }

  _findAssignment(assignmentName) {   //returns assignment object
    return this.assignmentStatuses.find(a => a.assignmentName === assignmentName); //finds an assignment with the same name as argument
  }

  _notifyStatus(assignmentName, status) { //creates and sends notification based on assignment status
    if (!this.observer) return; //returns nothing if there is no observer for assignment 
    let msg;
    if (status === "released") msg = `${this.fullName}, ${assignmentName} has been released.`; //based on the status using if statment, send appropriate notification message
    else if (status === "working") msg = `${this.fullName} is working on ${assignmentName}.`;
    else if (status === "submitted") msg = `${this.fullName} has submitted ${assignmentName}.`;
    else if (status === "passed") msg = `${this.fullName} has passed ${assignmentName}`;
    else if (status === "failed") msg = `${this.fullName} has failed ${assignmentName}`;
    else if (status === "final reminder") msg = `${this.fullName}, final reminder for ${assignmentName}.`;
    else msg = `${this.fullName}, ${assignmentName} status is now ${status}.`;
    this.observer.notify(msg); //sends the message to the observer object using the method found in observer to print it out
  }

  updateAssignmentStatus(assignmentName, grade) {
    let assignment = this._findAssignment(assignmentName);  //to update the assignment, first find the assignment with same name as desired assignment
    if (!assignment) { //if there is no assignment then create a new one as if a new assignment has been released
      assignment = new Assignment(assignmentName, "released"); //create a new assignment with the "released" status
      this.assignmentStatuses.push(assignment);
      this._notifyStatus(assignmentName, assignment.status); //updates the notification for the assignment by sending the name and status; notifies that new assignmnet has been made and ultimately sends to observer
    }
    if (typeof grade === "number") { //the grade passed through used to update status through setGrade
      assignment.setGrade(grade); //sets the grade so status can be determined
      this._notifyStatus(assignmentName, assignment.status); //updates notification status for pass/fail
    }
  }

  getAssignmentStatus(assignmentName) {
    const assignment = this._findAssignment(assignmentName); //finds the desired assignment with the same name
    if (!assignment) return "Hasn't been assigned"; //if it doesn't exist then its not assigned yet
    if (typeof assignment._grade === "number") {
      return assignment._grade > 50 ? "Pass" : "Fail"; //returns a pass or fail instead of internal status values
    }
    return assignment.status; //returns the status of the assignment passed through if there is no grade yet for like "working" or "released"
  }

  startWorking(assignmentName) {
    let assignment = this._findAssignment(assignmentName); //finds assignment
    if (!assignment) {
      assignment = new Assignment(assignmentName, "released"); //if there is no assignment, release a new assignment to start working on it 
      this.assignmentStatuses.push(assignment);
      this._notifyStatus(assignmentName, assignment.status); //updates status through obsever
    }
    assignment.status = "working"; //starts working on assignment, sets the status regardless of assignment arguement since if there is none, it creates one to work on
    this._notifyStatus(assignmentName, assignment.status); //updates new status

    if (this._workTimers[assignmentName]) { //if the assignment already is being worked on, cancel it so multiple submissions/timers don't exist
      clearTimeout(this._workTimers[assignmentName]);
    }

    this._workTimers[assignmentName] = setTimeout(() => {  //sets a 500ms timer for between working on it, and finishing it, and submits the assignment for grading
      this.submitAssignment(assignmentName);
    }, 500);
  }

  submitAssignment(assignmentName) {
    let assignment = this._findAssignment(assignmentName); //finds assignment

    if (!assignment) {  //creates the assignment if it hadn't already existed, ensuring theres something to submit
      assignment = new Assignment(assignmentName, "released"); //assigns the assignment as released intially so that it follows the work flow
      this.assignmentStatuses.push(assignment);
      this._notifyStatus(assignmentName, assignment.status); //updates the observer, since its been newly released won't be submitted yet
    }

    if (this._workTimers[assignmentName]) {      //resets the timer by deleting it, stopping multiple submissions due to asynchornus submissions
      clearTimeout(this._workTimers[assignmentName]);
      delete this._workTimers[assignmentName];
    }

    if (["submitted", "passed", "failed"].includes(assignment.status)) return; //if its already been submitted, as has any of those 3 statuses, it returns nothing since they've been submitted and graded already

    assignment.status = "submitted"; //after the if statements to catch any irregular submissions, it sets the status as submitted and updates oberserver
    this._notifyStatus(assignmentName, assignment.status);

    setTimeout(() => {     //timer used to grade the assignment randomly from 0-100 after 500ms
      const grade = Math.floor(Math.random() * 101); //randomly generates number and sets to grade
      assignment.setGrade(grade); //grade is passed through for actual grading and status update
      this._notifyStatus(assignmentName, assignment.status); //change and output the status
      this.getGrade();
    }, 500);
  }

  receiveReminder(assignmentName) {
    let assignment = this._findAssignment(assignmentName); //finds appropriate assignment

    if (!assignment) {
      assignment = new Assignment(assignmentName, "final reminder"); //sets the assignment status to final reminder for a newly created assignment to ensure it exists
      this.assignmentStatuses.push(assignment);
    } else {
      assignment.status = "final reminder";  //sets the status to final reminder when it does exist in the argument, and will then be automatically submitted
    }

    this._notifyStatus(assignmentName, assignment.status); //updates observer
    this.submitAssignment(assignmentName); //submits assignment whenever the reminder comes out
  }

  getGrade() {
    const graded = this.assignmentStatuses.filter(a => typeof a._grade === "number");  //finds the grade from the array of graded assignments
    if (graded.length === 0) {  //returns 0 as an average if there are no assignments in array, therefore no graded assignments exist yet
      this.overallGrade = null;
      return null;
    }
    const total = graded.reduce((sum, a) => sum + a._grade, 0); //sums up the values found going through array, and averages them with equal weight
    const avg = total / graded.length; //divides by length/amount of assignments 
    this.overallGrade = avg;
    return avg;  //returns final calculated average 
  }
}

class ClassList {
  constructor(observer) { //uses the observer to add things to ClassList, part of the constructor 
    this.observer = observer;
    this.students = []; //students array filled with student element(s)
  }

  addStudent(student) {
    this.students.push(student); //adds student to array
    console.log(`${student.fullName} has been added to the classlist.`); //prints out in console they've been added
  }

  removeStudent(studentOrName) {
    const name = typeof studentOrName === "string" ? studentOrName : studentOrName.fullName; 
    this.students = this.students.filter(s => s.fullName !== name); 
  }

  findStudentByName(fullName) { //finds student by name
    return this.students.find(s => s.fullName === fullName); 
  }

  findOutstandingAssignments(assignmentName) {
    const completed = ["submitted", "passed", "failed"]; //sets 3 status as "completed" for checking if its outstanding
    //finds the student with the assignment that is outstanding and returns the student name
    if (assignmentName) { //when given an assignment name...
      return this.students 
        .filter(student => {const a = student._findAssignment(assignmentName); //finds the assignment with this name for the student
          if (!a) return true; //if the student doesn't have the assignment it is considered outstanding
          return !completed.includes(a.status); //returns the status elements that aren't "completed" on the status array; becomes true for outstanding work
        })
        .map(s => s.fullName); //returns the student's name if they have outstanding assignment
    }
    return this.students
      .filter(student => student.assignmentStatuses.some(a => !completed.includes(a.status)) //returns the student name with any assignment that is outstanding, rather than for one specific assignment
      )
      .map(s => s.fullName); //returns those names that have any outstanding status
  }

  releaseAssignmentsParallel(assignmentNames) {
    const allPromises = assignmentNames.map(name => { //maps the assignment name to a Promise for each student
      const perStudent = this.students.map(student => { //for each assignment, create a Promise for each student
        return new Promise(resolve => { //wraps the update in a Promise to make release asynchornus
          setTimeout(() => {
            student.updateAssignmentStatus(name); //release assignment 
            resolve(); //mark the assignment release as finished
          }, 0);
        });
      });
      return Promise.all(perStudent); //wait for all students to receieve the assignment
    });
    return Promise.all(allPromises); //finishes when all student get their assignments
  }

  sendReminder(assignmentName) {
    const completed = ["submitted", "passed", "failed"]; //sets what constitutes as complete
    this.students.forEach(student => {
      const a = student._findAssignment(assignmentName); //sets a as variable to search for assignment
      const notDone = !a || !completed.includes(a.status); //notDone set as all the assignments that aren't finished
      if (notDone) student.receiveReminder(assignmentName); //send a reminder if the assignment isn't done
    });
  }
}


  // === Example Usage Copy and Pasted From Instructions For Testing===
const observer = new Observer();
const classList = new ClassList(observer);

const s1 = new Student("Alice Smith", "alice@example.com", observer);
const s2 = new Student("Bob Jones", "bob@example.com", observer);

classList.addStudent(s1);
classList.addStudent(s2);

classList.releaseAssignmentsParallel(["A1", "A2"]).then(() => {
  s1.startWorking("A1");
  s2.startWorking("A2");

  setTimeout(() => classList.sendReminder("A1"), 200);
});


