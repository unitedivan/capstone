document.addEventListener('DOMContentLoaded', () => {
  // Tab buttons at the top of the auth card
  const tabs = document.querySelectorAll('.auth-tab');

  // The two forms controlled by those tabs
  const forms = {
    login: document.getElementById('login-form'),
    signup: document.getElementById('signup-form')
  };

  // Stop early if the expected auth elements are missing
  if (!tabs.length || !forms.login || !forms.signup) return;

  // Shows one tab and its form while hiding the other one
  const setActiveTab = (tabName) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.authTab === tabName;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    Object.entries(forms).forEach(([name, form]) => {
      form.classList.toggle('active', name === tabName);
    });
  };

  // Switches between login and sign-up forms when a tab is clicked
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setActiveTab(tab.dataset.authTab);
    });
  });

  // Demo behavior: after submit, move to the profile page
  const handleAuthSubmit = (event) => {
    event.preventDefault();
    window.location.href = 'profile.html';
  };

  forms.login.addEventListener('submit', handleAuthSubmit);
  forms.signup.addEventListener('submit', handleAuthSubmit);
});
