let category_nav_list = document.querySelector('.category_nav_list');

function open_cat_list(){
    category_nav_list.classList.toggle('active')
}

var swiper = new Swiper(".mySwiper", {
    pagination: {
        el: ".swiper-pagination",
        dynamicBullests:true,
        clickable:true
    },
    autoplay:{
        delay:2500,
      },
      loop:true,
    });
    swiper()