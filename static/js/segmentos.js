
document.getElementById('motos').addEventListener('click', () => {
  window.location.href = '/motos';
});

document.getElementById('nautica').addEventListener('click', () => {
  window.location.href = '/nautica';
});

document.getElementById("user-button").addEventListener("click", function () {
  document.getElementById("user-dropdown").classList.toggle("show");
});

window.onclick = function (event) {
  if (!event.target.matches('#user-button')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (var i = 0; i < dropdowns.length; i++) {
      if (dropdowns[i].classList.contains('show')) {
        dropdowns[i].classList.remove('show');
      }
    }
  }
};