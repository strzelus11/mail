document.addEventListener("DOMContentLoaded", function () {
	// Use buttons to toggle between views
	document
		.querySelector("#inbox")
		.addEventListener("click", () => load_mailbox("inbox"));
	document
		.querySelector("#sent")
		.addEventListener("click", () => load_mailbox("sent"));
	document
		.querySelector("#archived")
		.addEventListener("click", () => load_mailbox("archive"));
    document.querySelector("#compose").addEventListener("click", compose_email);
    
    document.querySelector("#compose-form").onsubmit = send_email;

	// By default, load the inbox
	load_mailbox("inbox");
});

function compose_email() {
	// Show compose view and hide other views
	document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "block";
    document.querySelector("#email-detail-view").style.display = "none";

	// Clear out composition fields
	document.querySelector("#compose-recipients").value = "";
	document.querySelector("#compose-subject").value = "";
	document.querySelector("#compose-body").value = "";
};


function view_email(id) {
    fetch(`/emails/${id}`)
	.then((response) => response.json())
	.then((email) => {
		// Print email
        console.log(email);

        document.querySelector("#emails-view").style.display = "none";
		document.querySelector("#compose-view").style.display = "none";
		document.querySelector("#email-detail-view").style.display = "block";
        
        document.querySelector("#email-detail-view").innerHTML = `
            <ul class="list-group">
                <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
                <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
                <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
                <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
            </ul>

            <div>
                ${email.body}
            </div>
        `;

        // Change to read
        if (!email.read) {
            fetch(`/emails/${email.id}`, {
				method: "PUT",
				body: JSON.stringify({
					read: true
				})
			})
        }

        // Archive/Unarchive button
        const btn_archive = document.createElement("button");
		btn_archive.innerHTML = email.archived ? "Unarchive" : "Archive";
		btn_archive.className = email.archived
			? "btn btn-success"
			: "btn btn-danger";
		btn_archive.addEventListener("click", function () {
            console.log("This email has been archived!");
            fetch(`/emails/${email.id}`, {
				method: "PUT",
				body: JSON.stringify({
					archived: !email.archived
				})
            })
            .then(() => {load_mailbox("archive")})
		});
        document.querySelector("#email-detail-view").append(btn_archive);
        
        // Reply button
        const btn_reply = document.createElement("button");
		btn_reply.innerHTML = "Reply";
		btn_reply.className = "btn btn-info"; 
		btn_reply.addEventListener("click", function () {
            console.log("Reply");
            compose_email();

            document.querySelector("#compose-recipients").value = email.sender;
            let subject = email.subject;
            if (subject.split(" ", 1)[0] != "Re:") {
                subject = "Re: " + email.subject;
            }
			document.querySelector("#compose-subject").value = subject;
            document.querySelector("#compose-body").value = `On ${email.timestamp} ${email.sender} wrote:
            ${email.body}`;
		});
		document.querySelector("#email-detail-view").append(btn_reply);

	});
};


function load_mailbox(mailbox) {
	// Show the mailbox and hide other views
	document.querySelector("#emails-view").style.display = "block";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#email-detail-view").style.display = "none";

	// Show the mailbox name
	document.querySelector("#emails-view").innerHTML = `<h3>${
		mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
        }</h3>`;
    
    // Get the emails for that mailbox and user
    fetch(`/emails/${mailbox}`)
	.then((response) => response.json())
    .then(emails => {
        // Loop through emails
        emails.forEach(singleEmail => {
        
            console.log(singleEmail);

            // Create div for each email
            const newEmail = document.createElement("div");

            // Change background color
            newEmail.innerHTML = singleEmail.read
							? `
            <ul class="list-group">
                <li class="d-flex justify-content-between list-group-item list-group-item-dark">
                <h6>From: ${singleEmail.sender}</h6>
                <h5>Subject: <strong>${singleEmail.subject}</strong></h5>
                <p><i>${singleEmail.timestamp}</i></p></li>
            </ul>
            `
							: `
            <ul class="list-group">
                <li class="d-flex justify-content-between list-group-item">
                <h6>From: ${singleEmail.sender}</h6>
                <h5>Subject: <strong>${singleEmail.subject}</strong></h5>
                <p><i>${singleEmail.timestamp}</i></p></li>
            </ul>
            `;
            // Add click event to email
            newEmail.addEventListener("click", function() {
                view_email(singleEmail.id)
            });
            document.querySelector("#emails-view").append(newEmail);
        })
    });
}

function send_email(event) {
    event.preventDefault();

    // Create variables
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    // Send the email
    fetch("/emails", {
        method: "POST",
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        load_mailbox("sent");
    })
};


