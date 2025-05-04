var swiper = new Swiper(".slide_swp", {
    pagination: {
        el: ".swiper-pagination",
        dynamicBullests:true,
        clickable:true
    },
    autoplay:{
        delay:3000,
      },
      loop:true,
    });

    /*swiper products */
    var swiper = new Swiper(".slide_product", {
        slidesPerView:5 ,
        spaceBetween:20,
        autoplay:{
            delay:2000,
          },
          navigation:{
            nextEl:".swiper-button-next",
            prevEl:".swiper-button-prev"
          },
          loop:true,
        });