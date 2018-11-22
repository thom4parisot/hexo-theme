// load comments asynchronously
const loadCommentsBtn = document.querySelector('.action__load-comments');
if (loadCommentsBtn) {
  loadCommentsBtn.addEventListener('click', ({target}) => {
    loadCommentsBtn.disabled = true;

    const script = document.createElement('script');
    script.src = '//oncletom.disqus.com/embed.js';
    script.onload = () => loadCommentsBtn.hidden = true;
    document.body.appendChild(script);
  });
}
