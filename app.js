function switchTab(evt, tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

function goToProvince(provinceName) {
    // Switch to details tab
    const tabBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.textContent.includes('รายชื่อ'));

    if (tabBtn) {
        tabBtn.click();
    }

    // Scroll to the province card
    setTimeout(() => {
        const provinceId = 'province-' + provinceName;
        const provinceCard = document.getElementById(provinceId);
        if (provinceCard) {
            provinceCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Add a highlight effect
            provinceCard.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
            setTimeout(() => {
                provinceCard.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }, 2000);
        }
    }, 100);
}

function filterDetailsContent(event) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.province-card');

    // Clear all previous highlights
    document.querySelectorAll('.athlete-row.athlete-highlight').forEach(el => {
        el.classList.remove('athlete-highlight');
    });

    if (!searchTerm) {
        cards.forEach(card => { card.style.display = 'block'; });
        return;
    }

    cards.forEach(card => {
        const rows = card.querySelectorAll('.athlete-row');
        const provinceName = (card.dataset.province || '').toLowerCase();
        let hasMatch = false;

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm) || provinceName.includes(searchTerm)) {
                row.classList.add('athlete-highlight');
                hasMatch = true;
            }
        });

        // Also match province header
        if (provinceName.includes(searchTerm)) {
            hasMatch = true;
        }

        card.style.display = hasMatch ? 'block' : 'none';
    });
}

// Transport Gallery
const transportImages = [
    { file: '1.jpg', caption: 'สถานีขนส่งในจังหวัด', desc: 'สนามบิน, สถานีรถไฟ, บขส., ท่ารถตู้' },
    { file: '2.jpg', caption: 'สถานีรถไฟ', desc: 'การเดินทางจากสถานีรถไฟ และการเผื่อเวลา' },
    { file: '3.jpg', caption: 'สนามบิน', desc: 'รการเดินทางจากสนามบิน และการเผื่อเวลา' },
    { file: '4.jpg', caption: 'บขส.', desc: 'การเดินทางจาก บขส. และการเผื่อเวลา' },
    { file: '5.jpg', caption: 'ตลาดเกษตร 1', desc: 'จุดหมายปลายทางและท่ารถเมล์ และการเผื่อเวลา' },
    { file: '6.jpg', caption: 'ตลาดเกษตร 2', desc: 'ท่ารถตู้ที่มาจากจังหวัดใกล้เคียง และการเผื่อเวลา' },
    { file: '7.jpg', caption: 'กรณีหลงทาง', desc: 'ให้กลับมาตั้งหลักที่ตลาดเกษตร 1 หรือตลาดเกษตร 2' },
    { file: '8.jpg', caption: 'สถานที่จัดงาน', desc: 'อาคารศูนย์กลางการประชุมสัมมนาภาคใต้ตอนบน ศาลากลางจังหวัดสุราษฎร์ธานี' },
];

// Try all common image extensions
const imgExtensions = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'PNG'];
// Also scan numeric patterns like 001.jpg, 1.jpg and named files
const imgPatterns = [];
for (let i = 1; i <= 30; i++) {
    imgPatterns.push(String(i).padStart(2, '0'));
    imgPatterns.push(String(i));
}

let lightboxImages = [];
let lightboxIndex = 0;

function buildTransportGallery() {
    const gallery = document.getElementById('transportGallery');
    gallery.innerHTML = '';
    lightboxImages = [];

    // Build from configured list first
    transportImages.forEach((item, idx) => {
        const imgPath = `images/transport/${item.file}`;
        addGalleryCard(gallery, imgPath, item.caption, item.desc, idx);
    });
}

function addGalleryCard(container, imgPath, caption, desc, idx) {
    lightboxImages.push({ src: imgPath, caption });

    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.innerHTML = `
        <div class="gallery-img-wrap">
            <img src="${imgPath}" alt="${caption}"
                 onerror="this.style.display='none'; this.nextElementSibling.nextElementSibling.style.display='flex';"
                 loading="lazy">
            <div class="img-overlay"></div>
            <div class="gallery-img-placeholder" style="display:none;">
                <span>🖼️</span>
                <span>${caption}</span>
                <span style="font-size:10px; color:#bbb;">${imgPath}</span>
            </div>
        </div>
        <div class="gallery-caption">
            <h4>${caption}</h4>
            <p>${desc}</p>
        </div>`;
    card.addEventListener('click', () => openLightbox(idx));
    container.appendChild(card);
}

function openLightbox(idx) {
    lightboxIndex = idx;
    const item = lightboxImages[idx];
    document.getElementById('lightboxImg').src = item.src;
    document.getElementById('lightboxCaption').textContent = item.caption;
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
    if (e.target === document.getElementById('lightbox')) closeLightboxForce();
}

function closeLightboxForce() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
}

function lightboxNav(dir) {
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    openLightbox(lightboxIndex);
}

document.addEventListener('keydown', e => {
    if (document.getElementById('lightbox').classList.contains('open')) {
        if (e.key === 'ArrowLeft') lightboxNav(-1);
        if (e.key === 'ArrowRight') lightboxNav(1);
        if (e.key === 'Escape') closeLightboxForce();
    }
});


// About Surat Gallery
const aboutSuratImages = [
    { file: '1.jpg',  caption: 'แผนที่จังหวัดสุราษฎร์ธานี',     desc: '' },
    { file: '2.jpg',  caption: 'คำขวัญจังหวัดสุราษฎร์ธานี',     desc: '' },
    { file: '3.jpg',  caption: 'เมืองร้อยเกาะ',     desc: '' },
    { file: '4.jpg',  caption: 'เงาะอร่อย',     desc: '' },
    { file: '5.jpg',  caption: 'หอยใหญ่',     desc: '' },
    { file: '6.jpg',  caption: 'ไข่แดง',     desc: '' },
    { file: '7.jpg',  caption: 'แหล่งธรรมะ',     desc: '' },
    { file: '8.jpg',  caption: 'มาสคอตน้องตะพัดทอง',     desc: '' },

];

let aboutLightboxImages = [];

function buildAboutGallery() {
    const gallery = document.getElementById('aboutGallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    aboutLightboxImages = [];

    aboutSuratImages.forEach((item, idx) => {
        const imgPath = `images/aboutsurat/${item.file}`;
        aboutLightboxImages.push({ src: imgPath, caption: item.caption });

        const card = document.createElement('div');
        card.className = 'about-gallery-card';

        const localIdx = idx;
        card.innerHTML = `
            <div class="about-gallery-img-wrap">
                <img src="${imgPath}" alt="${item.caption}"
                     onerror="this.style.display='none'; this.nextElementSibling.nextElementSibling.style.display='flex';"
                     loading="lazy">
                <div class="img-overlay"></div>
                <div class="about-gallery-placeholder" style="display:none;">
                    <span>🌴</span>
                    <span>${item.caption}</span>
                    <span style="font-size:10px; color:#bbb;">${imgPath}</span>
                </div>
            </div>
            <div class="about-gallery-caption">
                <h4>${item.caption}</h4>
                <p>${item.desc}</p>
            </div>`;

        card.addEventListener('click', () => {
            // Use aboutLightboxImages for this gallery
            lightboxImages = aboutLightboxImages;
            openLightbox(localIdx);
        });
        gallery.appendChild(card);
    });
}

buildTransportGallery();
buildAboutGallery();

function openClubStaffLightbox() {
    const img = document.getElementById('clubStaffImg');
    if (!img || img.style.display === 'none') return;
    lightboxImages = [{ src: img.src, caption: 'คณะกรรมการและบุคลากรชมรมกีฬาอีสปอร์ตจังหวัดสุราษฎร์ธานี' }];
    openLightbox(0);
}

// Food & Shopping Gallery
const foodImages = [
    { file: '1.jpg',  caption: 'ตลาดศาลเจ้าสุราษฎร์ธานี',    desc: 'แหล่งสตรีทฟู๊ดกลางเมือง',          category: 'food'     },
    { file: '2.jpg',  caption: 'ห้างโคลีเซียม',               desc: 'ห้างเสื้อผ้าและโรงหนังใกล้ตลาดเกษตร',        category: 'shopping'     },
    { file: '3.jpg',  caption: 'ตลาดซันนี่มาร์เก็ต',                    desc: 'ตลาดกลางคืนข้างสหไทย แหล่งสตรีทฟู๊ดกลางเมือง',                 category: 'food'     },
    { file: '4.jpg',  caption: 'เซ็นทรัลพลาซ่า สุราษฎร์ธานี',               desc: 'ห้างบริเวณสี่แยกท่ากูบ ทางไปสนามบิน',         category: 'food'     },
    { file: '5.jpg',  caption: 'ไมตรี',        desc: 'ร้านนั่งชิว แหล่งพบปะแอดมินสุราษฎร์ธานี 4.0',            category: 'food' },
    { file: '6.jpg',  caption: 'Echo Roastery Coffee',       desc: 'ร้านกาแฟและร้านอาหารแถวห้างแม็คโคร',              category: 'food' },
    { file: '7.jpg',  caption: 'Roam Coffee',             desc: 'ร้านกาแฟแถวค่ายวิภาวดีรังสิตใกล้สนามกีฬา',      category: 'cafe'     },
    { file: '8.jpg',  caption: 'คาเฟ่วิวสวย',                  desc: 'นั่งชิลล์ในบรรยากาศธรรมชาติ',       category: 'cafe'     },
    { file: '9.jpg',  caption: 'ผลไม้สดจากสวน',               desc: 'เงาะ มังคุด ลองกอง ราคาถูก',        category: 'food'     },
    { file: '10.jpg', caption: 'ของที่ระลึก',                  desc: 'ของฝากพื้นเมืองราคาจับต้องได้',     category: 'shopping' },
    { file: '11.jpg', caption: 'อาหารทะเล',                   desc: 'อาหารทะเลสดจากอ่าวบ้านดอน',        category: 'food'     },
    { file: '12.jpg', caption: 'Central Suratthani',          desc: 'ห้างสรรพสินค้าใจกลางเมือง',         category: 'shopping' },
];

const categoryLabels = { food: '🍽️ อาหาร', shopping: '🛒 ช็อปปิ้ง', cafe: '☕ คาเฟ่' };
const categoryBadgeClass = { food: 'badge-food', shopping: 'badge-shopping', cafe: 'badge-cafe' };
let foodLightboxImages = [];
let currentFoodFilter = 'all';

function buildFoodGallery(filter) {
    const gallery = document.getElementById('foodGallery');
    gallery.innerHTML = '';
    foodLightboxImages = [];
    const filtered = filter === 'all' ? foodImages : foodImages.filter(i => i.category === filter);

    filtered.forEach((item, idx) => {
        const imgPath = `images/food/${item.file}`;
        foodLightboxImages.push({ src: imgPath, caption: item.caption });

        const badgeClass = categoryBadgeClass[item.category] || 'badge-food';
        const badgeLabel = categoryLabels[item.category] || '';

        const card = document.createElement('div');
        card.className = 'food-card';
        card.innerHTML = `
            <div class="food-card-img-wrap">
                <img src="${imgPath}" alt="${item.caption}"
                     onerror="this.style.display='none'; this.nextElementSibling.nextElementSibling.nextElementSibling.style.display='flex';"
                     loading="lazy">
                <div class="img-overlay"></div>
                <span class="food-category-badge ${badgeClass}">${badgeLabel}</span>
                <div class="food-card-placeholder" style="display:none;">
                    <span>🍜</span>
                    <span>${item.caption}</span>
                    <span style="font-size:10px; color:#ccc;">${imgPath}</span>
                </div>
            </div>
            <div class="food-card-caption">
                <h4>${item.caption}</h4>
                <p>${item.desc}</p>
            </div>`;
        const localIdx = idx;
        card.addEventListener('click', () => {
            lightboxImages = foodLightboxImages;
            openLightbox(localIdx);
        });
        gallery.appendChild(card);
    });
}

function filterFoodGallery(filter, btn) {
    currentFoodFilter = filter;
    document.querySelectorAll('.food-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    buildFoodGallery(filter);
}

buildFoodGallery('all');

// Schedule Functions
function switchSchedDay(id, btn) {
    document.querySelectorAll('.sched-day-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sched-day-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
}
