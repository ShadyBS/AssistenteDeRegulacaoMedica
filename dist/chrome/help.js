/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!*****************!*\
  !*** ./help.js ***!
  \*****************/
__webpack_require__.r(__webpack_exports__);
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('main section');
  const tocLinks = document.querySelectorAll('#toc a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute('id');
      const tocLink = document.querySelector(`#toc a[href="#${id}"]`);
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        tocLinks.forEach(link => link.classList.remove('active'));
        if (tocLink) {
          tocLink.classList.add('active');
        }
      }
    });
  }, {
    rootMargin: '0px 0px -50% 0px',
    threshold: 0.5
  });
  sections.forEach(section => {
    observer.observe(section);
  });
});
/******/ })()
;
//# sourceMappingURL=help.js.map