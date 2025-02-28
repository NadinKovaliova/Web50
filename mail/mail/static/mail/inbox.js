document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');

  // Hide email view initially
  document.querySelector('#email-view').style.display = 'none';
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#quoted-body').style.display = 'none';
  document.querySelector('#quoted-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none'; 

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the emails for the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Create a container for the emails
    const emailsContainer = document.createElement('div');
    emailsContainer.style.maxWidth = '800px';
   // emailsContainer.style.margin = '0 auto';
    
    // For each email, create a div
    emails.forEach(email => {
      const emailDiv = document.createElement('div');
      
      // Modern email card styling
      emailDiv.style.border = '1px solid #e0e0e0';
      emailDiv.style.borderRadius = '8px';
      emailDiv.style.margin = '12px 0';
      emailDiv.style.padding = '16px';
      emailDiv.style.backgroundColor = email.read ? '#f8f9fa' : 'white';
      emailDiv.style.cursor = 'pointer';
      emailDiv.style.transition = 'all 0.2s ease';
      emailDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
      
      // Hover effect
      emailDiv.onmouseover = () => {
        emailDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        emailDiv.style.transform = 'translateY(-1px)';
      };
      emailDiv.onmouseout = () => {
        emailDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        emailDiv.style.transform = 'translateY(0)';
      };

      // Add email content
      emailDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #2c3e50; font-size: 16px;">${email.sender}</strong>
          <span style="color: #7f8c8d; font-size: 14px;">${email.timestamp}</span>
        </div>
        <div style="color: #34495e; font-size: 15px;">${email.subject}</div>
      `;

      // Add event listener to view email
      emailDiv.addEventListener('click', () => view_email(email.id));

      // Add the email div to the container
      emailsContainer.appendChild(emailDiv);
    });

    // Add the container to the emails view
    document.querySelector('#emails-view').appendChild(emailsContainer);
  });
}

function send_email(event) {
  // Prevent default form submission
  event.preventDefault();

  // Get form data
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const text = document.querySelector('#compose-body').value;
  const quotedText = document.querySelector('#quoted-body').value;
  

  const body = quotedText ? `${text}\n${quotedText}` :`${text}`;

  // Send email using fetch API
  fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
  })
  .then(response => response.json())
  .then(result => {
      // If sent successfully, load sent mailbox
      if (!result.error) {
          load_mailbox('sent');
      } else {
          // If there's an error, you could display it to the user
          console.log(result.error);
      }
  });

  return false;
}

function view_email(email_id) {
  // Show email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';


  // Get current mailbox from the header before clearing it
  const currentMailbox = document.querySelector('#emails-view h3')
    .textContent.toLowerCase() === 'archive' ? 'archived' : 
    document.querySelector('#emails-view h3').textContent.toLowerCase();

  // Clear previous email content
  document.querySelector('#email-view').innerHTML = '';

  // Fetch email content
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Mark email as read
    if (!email.read) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    }

    // Create and style email view container
    const emailView = document.createElement('div');
    emailView.className = 'email-details';
    emailView.style.padding = '20px';
    emailView.style.maxWidth = '800px';
   // emailView.style.margin = '0 auto';
    emailView.style.backgroundColor = 'white';
    emailView.style.borderRadius = '8px';
    emailView.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

    // Create archive button HTML only if not in sent mailbox
    const archiveButton = currentMailbox !== 'sent' ? 
`<button class="btn btn-primary" 
style="background-color: #e74c3c; border: none; padding: 8px 16px; border-radius: 6px;" 
onclick="toggle_archive(${email_id}, ${!email.archived})">
      ${email.archived ? 'Unarchive' : 'Archive'}
    </button>` : '';

    // Create unread button HTML only for received and non-archived emails
    const unreadButton = (email.sender !== document.querySelector('#compose-form [disabled]').value && !email.archived) ? 
    `<button class="btn btn-info" style="background-color: #2ecc71; border: none; padding: 8px 16px; border-radius: 6px;" onclick="toggle_read(${email_id}, false)">
      Mark as Unread
    </button>` : '';

    const backButton = `<button class="btn btn-secondary" 
      style="background-color: #95a5a6; border: none; padding: 8px 16px; border-radius: 6px;"
      onclick="document.querySelector('#${currentMailbox}').click()">
      Back to ${currentMailbox.charAt(0).toUpperCase() + currentMailbox.slice(1)}
     </button>`;

    // Display email content
    emailView.innerHTML = `
      <div style="margin-bottom: 24px;">
        <p style="margin: 8px 0;"><strong style="color: #2c3e50;">From:</strong> <span style="color: #34495e;">${email.sender}</span></p>
        <p style="margin: 8px 0;"><strong style="color: #2c3e50;">To:</strong> <span style="color: #34495e;">${email.recipients.join(', ')}</span></p>
        <p style="margin: 8px 0;"><strong style="color: #2c3e50;">Subject:</strong> <span style="color: #34495e;">${email.subject}</span></p>
        <p style="margin: 8px 0;"><strong style="color: #2c3e50;">Timestamp:</strong> <span style="color: #7f8c8d;">${email.timestamp}</span></p>
      </div>
      <hr style="border: none; border-top: 1px solid #e0e0e0;">
      <div style="margin: 24px 0; color: #2c3e50; line-height: 1.6; white-space: pre-wrap;">${email.body}</div>
      <hr style="border: none; border-top: 1px solid #e0e0e0;">
      <div style="display: flex; gap: 12px; margin-top: 16px;">
        <button class="btn btn-primary" style="background-color: #3498db; border: none; padding: 8px 16px; border-radius: 6px;" onclick="reply_email(${JSON.stringify(email).replace(/"/g, '&quot;')})">Reply</button>
        ${unreadButton}
        ${archiveButton}
        ${backButton}
      </div>
    `;

    // Add the email view to the DOM
    document.querySelector('#email-view').appendChild(emailView);
  })
  .catch(error => {
    console.log('Error:', error);
    document.querySelector('#email-view').innerHTML = 'Error loading email.';
  });
}

// Add this new function to handle archiving/unarchiving
function toggle_archive(email_id, archive_status) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archive_status
    })
  })
  .then(() => {
    // After archiving/unarchiving, load the inbox
    load_mailbox('inbox');
  });
}

// Add this new function to handle toggling read status
function toggle_read(email_id, read_status) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: read_status
    })
  })
  .then(() => {
    load_mailbox('inbox');
  });
}

// Add new reply function
function reply_email(email) {
  // Show compose view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  const currentUserEmail = document.querySelector('#compose-form [disabled]').value;

  // Pre-fill recipient field
  const allRecipients = new Set([email.sender, ...email.recipients]);
  allRecipients.delete(currentUserEmail);
  document.querySelector('#compose-recipients').value = Array.from(allRecipients).join(', ');

  // Pre-fill subject line
  const subject = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-subject').value = subject;

  document.querySelector('#compose-body').value = '';
  document.querySelector('#quoted-body').style.display = 'block';
  document.querySelector('#quoted-body').value = 
      `-----------------------------------------------\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;

}

