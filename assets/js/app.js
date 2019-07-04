function randomString() {
    var ID = "",
        alphabet = "abcdefghijklmnopqrstuvwxyz";

    for (var i = 0; i < 5; i++) {
        ID += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return ID;
}

function pjax(url) {
    axios.get(url).then(function (res) {
        var template = document.createElement('div');
        var parts = res.data.trim().split("<!--===thisExplodePointPjax===-->")
        template.innerHTML = parts[1];
        var doc = template.getElementsByClassName('post-body');

        var articleDom = doc[0];


        document.getElementById('post').innerHTML = articleDom.innerHTML
        createMarkdownIndex()
    }).catch(function (error) {
        console.log(error);
    });
};

function createMarkdownIndex() {
    var tocHtml = '';
    var h2ds = document.querySelectorAll("h2,h3")
    for (let h2d  of h2ds) {
        idh2 = randomString();
        h2d.setAttribute('id', idh2)
        if (h2d.tagName === "H2") {
            tocHtml += '<li class="post__toc-li post__toc-h2"><i class="fa fa-anchor"></i> <a href="#' + idh2 + '" class="js-anchor-link">' + h2d.innerText + '</a></li>';
        } else {
            tocHtml += '<li class="post__toc-li post__toc-h3"><i class="fa fa-anchor"></i> <a href="#' + idh2 + '" class="js-anchor-link">' + h2d.innerText + '</a></li>';
        }
    }
    document.getElementById('post__toc-ul').innerHTML = tocHtml
};
window.onpopstate = function (e) {
    var state = e.state;
    if (state !== null) {
        document.title = state.title;
        pjax(state.url);
    } else {
        document.title = 'tech.mojotv.cn';
    }
};
// Add a request interceptor
axios.interceptors.request.use(function (config) {
    // Do something before request is sent
    NProgress.start();
    return config;
}, function (error) {
    NProgress.done();
    // Do something with request error
    return Promise.reject(error);
});

// Add a response interceptor
axios.interceptors.response.use(function (response) {
    // Do something with response data
    NProgress.done();
    return response;
}, function (error) {
    NProgress.done();
    // Do something with response error
    return Promise.reject(error);
});

new Vue({
    el: '#app',
    data: {
        categories: null,
        articles: null,
        all: null,
        search: "",
        clickedCate: "",
        showPostList: true,
    },
    watch: {
        search: function (val) {
            if (val === '') {
                this.articles = this.all
                return
            }
            this.articles = this.all.filter(post => {
                var title = post.title.toUpperCase();
                var cp = val.toUpperCase();
                return title.indexOf(cp) !== -1
            });
        },
    },
    updated: function () {

    },
    created: function () {
        this.showPostList = window.location.pathname === '/';
    },
    mounted: function () {
        var vm = this
        axios.get('/api/article-list.json').then(function (response) {
            vm.categories = response.data.categories;
            vm.articles = response.data.articles;
            vm.all = response.data.articles;
        }).catch(function (error) {
            console.log(error);
        });
        createMarkdownIndex()
    },
    methods: {
        doToggleArticleList: function () {
            this.showPostList = !this.showPostList;
        },

        doView: function (item) {
            var url = item.url;
            var title = item.title;
            history.pushState({
                url: url,
                title: title
            }, title, url);
            document.title = title;
            pjax(url)
        },
        doSetPostList: function (val) {
            this.showPostList = val;
        },

        doChangeCate: function (val) {
            this.showPostList = true;
            this.search = '';
            this.clickedCate = val;
            if (val === "") {
                this.articles = this.all
                return
            }
            this.articles = this.all.filter(post => post.cate.toUpperCase() === val.toUpperCase());
        },

        humanTime: function (timeS) {
            var date = new Date(timeS)
            var delta = Math.round((+new Date - date) / 1000);
            var minute = 60,
                hour = minute * 60,
                day = hour * 24,
                week = day * 7;
            mm = day * 31;
            var fuzzy;

            if (delta < 30) {
                fuzzy = '现在';
            } else if (delta < minute) {
                fuzzy = delta + ' 秒前';
            } else if (delta < 2 * minute) {
                fuzzy = '一分钟前'
            } else if (delta < hour) {
                fuzzy = Math.floor(delta / minute) + ' minutes ago.';
            } else if (Math.floor(delta / hour) == 1) {
                fuzzy = '一小时前'
            } else if (delta < day) {
                fuzzy = Math.floor(delta / hour) + ' 小时前';
            } else if (delta < day * 2) {
                fuzzy = '昨天';
            } else if (delta < week) {
                fuzzy = Math.floor(delta / day) + ' 天前';
            } else if (delta < mm) {
                fuzzy = Math.floor(delta / week) + ' 周前';
            } else {
                fuzzy = date.toISOString().slice(2, 10).replace('T', ' ')

            }
            return fuzzy
        }
    }
})
;