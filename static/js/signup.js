const signupForm = document.querySelector('#signup-form');
const verifyForm = document.querySelector('#verify-form');
const result = document.querySelector('#result');
let requestId = sessionStorage.getItem('ngc_signup_request');
if (requestId) {
  signupForm.hidden = true;
  verifyForm.hidden = false;
  result.textContent = 'Enter the code we sent to your phone. It expires 10 minutes after your request.';
}

signupForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = signupForm.querySelector('button[type=submit]');
  button.disabled = true;
  result.textContent = 'Sending a confirmation code…';
  const data = Object.fromEntries(new FormData(signupForm));
  data.action = 'request';
  data.consent = Boolean(data.consent);
  try {
    const response = await fetch('/.netlify/functions/sms-signup', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
    });
    const body = await response.json();
    if (!response.ok) throw Error(body.error || 'Could not send a code.');
    requestId = body.request_id;
    sessionStorage.setItem('ngc_signup_request', requestId);
    signupForm.hidden = true;
    verifyForm.hidden = false;
    result.textContent = 'We sent a six-digit code to your phone. Enter it below within 10 minutes.';
    verifyForm.querySelector('input[name=code]').focus();
  } catch (error) {
    result.textContent = error.message;
    button.disabled = false;
  }
});

verifyForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = verifyForm.querySelector('button[type=submit]');
  button.disabled = true;
  result.textContent = 'Confirming…';
  try {
    const response = await fetch('/.netlify/functions/sms-signup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'confirm', request_id:requestId, code:verifyForm.elements.code.value})
    });
    const body = await response.json();
    if (!response.ok) throw Error(body.error || 'Could not confirm the code.');
    sessionStorage.removeItem('ngc_signup_request');
    location.assign('/text-updates/thanks/');
  } catch (error) {
    result.textContent = error.message;
    button.disabled = false;
  }
});

document.querySelector('#restart-signup').addEventListener('click', () => {
  requestId = null;
  sessionStorage.removeItem('ngc_signup_request');
  verifyForm.hidden = true;
  signupForm.hidden = false;
  signupForm.querySelector('button[type=submit]').disabled = false;
  result.textContent = 'You can request a new code. Request limits still apply.';
});
