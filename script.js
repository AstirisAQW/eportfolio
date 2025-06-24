window.addEventListener('load', () => {
  document.querySelector('.sidebar a[href="#about"]').click();
});

document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();

    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
document.querySelectorAll('.sidebar a').forEach(a => {
  a.classList.remove('active');
});
this.classList.add('active');
    const targetId = this.getAttribute('href').substring(1);

    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.style.display = 'block';
    }
  });
});
