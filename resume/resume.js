// resume/resume.js
document.addEventListener('DOMContentLoaded', () => {
  // Subtle fade-in on load
  const card = document.querySelector('.resume-card');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }));
  }
});