const sidebar = document.getElementById('sidebar');
const toggleIcon = document.getElementById('toggleIcon');
const segmentLink = document.querySelector('.logoLink');


toggleIcon.addEventListener('click', (e) => {
  sidebar.classList.remove('fechado'); 
  e.stopPropagation();
});


document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target)) {
    sidebar.classList.add('fechado');
  }
});


segmentLink.addEventListener('click', (e) => {
  if (sidebar.classList.contains('fechado')) {
    e.preventDefault(); 
    sidebar.classList.remove('fechado'); 
  }
});
