const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// =====================================================================
// KHO ẢNH THỜI TRANG 
// =====================================================================
const IMAGE_BANK = {
    'Áo thun/T-shirt': [
        'https://i.ibb.co/MkHHmCVd/0b6ae33811c53956886284c812c9ee5a-removebg-preview.png',
        'https://i.ibb.co/9HbpswBM/05e47b4bf7aa363a3d4d65353a6202c6-removebg-preview.png',
        'https://i.ibb.co/pjJC0bd4/35d025a136786fd1e9e0b24220f2c96c-removebg-preview.png',
        'https://i.ibb.co/bMQSZdM0/7b7d0bac606df9a9d0a8d4848174574b-removebg-preview.png',
        'https://i.ibb.co/k6rGrDRz/8dbadd12e0edee3a1f43813f0517cdd1-removebg-preview.png',
        'https://i.ibb.co/W47cMwn0/6bcd56803e7b094395a2a85ecf92ebd9-removebg-preview.png',
        'https://i.ibb.co/Fbn4v9Hg/6f655275e00d43477e7d9545dbf4d81d-removebg-preview.png',
        'https://i.ibb.co/Tx4d5PLG/343aab4fcbf5b0ce89ab865c8857b2e8-removebg-preview.png',
        'https://i.ibb.co/PvnsF4fs/560cdcf91112fe8ec8216483f2e6b24e-removebg-preview.png',
        'https://i.ibb.co/6cpSqBPt/462267d03ad9444da059bb6dc15a1777-removebg-preview.png',
        'https://i.ibb.co/CpvF8trQ/cea78f1ab9594616fe91abe50fcd7c3d-removebg-preview.png',
        'https://i.ibb.co/sv9jXFtY/da481cbe9e9e006f9bc165015c3f5032-removebg-preview.png',
        'https://i.ibb.co/B2BRJRW8/e143cf3f37caa3602bc467819c9d607e-removebg-preview.png',
        'https://i.ibb.co/YFFr61kW/fa2bc5b902750e8677c287288bb943da-removebg-preview.png',
        'https://i.ibb.co/RrfZ0pm/fd43f4a94f1275a7172cb56e19179dbe-removebg-preview.png'
    ],
    'Áo sơ mi/Blouse': [
        'https://i.ibb.co/7dM1p4zk/8eae10f8c67a1121e9f13628e93ad6d4-removebg-preview.png',
        'https://i.ibb.co/XfSqNQ7d/9b699d17b2dda28dd06bcc349bf49e0c-removebg-preview.png',
        'https://i.ibb.co/twVtq7BF/032efcf56615cfd2025d73e7ce928838-removebg-preview.png',
        'https://i.ibb.co/Vpx4jtyQ/1c31ec7d565bfb205135369d814421ec-removebg-preview.png',
        'https://i.ibb.co/kTGszsq/2dee9d8c644da4093caa117e97cbf150-removebg-preview.png',
        'https://i.ibb.co/cKycRdRn/84f6d63448cf427c8c3271b3214fbb68-removebg-preview.png',
        'https://i.ibb.co/bRJg563g/386c848e54b736981f7558d45efd3223-removebg-preview.png',
        'https://i.ibb.co/S4ZK4svP/702c74a064d3894ddd7b77c98e26d6df-removebg-preview.png',
        'https://i.ibb.co/G384Y3nW/3565e2a72f42f11d5bc4b0579144302a-removebg-preview.png',
        'https://i.ibb.co/cp7dpYp/bc00ac84513ee5f696605c9021887e1b-removebg-preview.png',
        'https://i.ibb.co/v4mXCM8Z/ca1263e3909608e716ed18e7a5deece2-removebg-preview.png',
        'https://i.ibb.co/5g54HZWs/ee7f372dcd91cf232063b89c37c45685-removebg-preview.png',
        'https://i.ibb.co/23Zvfj5V/f2c883ef6b3721e864840772854c9206-removebg-preview.png',
        'https://i.ibb.co/hJbgkFSb/f12afe63ef32116c55464099fd6b7cef-removebg-preview.png',
        'https://i.ibb.co/G6dDy7t/ffd6437194f2b36e6ab3ed3431de2f93-removebg-preview.png'
    ],
    'Váy/Đầm (Dress)': [
        'https://i.ibb.co/Q7QvcHP5/67da7cda02d1869796820c7df5e11d54-removebg-preview.png',
        'https://i.ibb.co/7xyr150C/0b8d0e3cd73d8bb27fa4869716c5424b-removebg-preview.png',
        'https://i.ibb.co/4RxBGZ6w/591c79407be2932adc92c49cfcf0225b-removebg-preview.png',
        'https://i.ibb.co/Mkvmn0WH/2caab3b8dfebcafa6db8ba78ad694578-removebg-preview.png',
        'https://i.ibb.co/MDLNyqkk/3f04fb7ee7956e250cf736d9fb652fc3-removebg-preview.png',
        'https://i.ibb.co/q3T7B3st/4f4136600a5b6f808e4a623f4699b48a-removebg-preview.png',
        'https://i.ibb.co/hjjtvGV/6b2285686f2439077f811ded3116272b-removebg-preview.png',
        'https://i.ibb.co/VbmvZG0/8efa04e62baebcb43fa3e5de5f4d35d8-removebg-preview.png',
        'https://i.ibb.co/ynrLNtFb/13b25b4c5a788cc6c31e09d5ad483513-removebg-preview.png',
        'https://i.ibb.co/ynpRVPsX/743634081237fddafc4c64a33425cba3-removebg-preview.png',
        'https://i.ibb.co/2YLMxRP6/bb337c7e2f01bc8fe2afdce1b4197f26-removebg-preview.png',
        'https://i.ibb.co/pjwn5k4H/e8b1153430e151b0ac0207efdcab5a34-removebg-preview.png',
        'https://i.ibb.co/GvQF3zg5/f10978c192bdff2d36ef5820cc71fd6d-removebg-preview.png'
    ],
    'Quần dài (Jeans/Trousers)': [
        'https://i.ibb.co/fY6zDQSw/02d8d991fb3a4cf150458e15c8f02053-removebg-preview.png',
        'https://i.ibb.co/S7HLVDd8/05101d5ef31537c49fe4f4355a820932-removebg-preview.png',
        'https://i.ibb.co/v6QP2hjZ/17cf5658d2071224c9a5508263762fa9-removebg-preview.png',
        'https://i.ibb.co/PGMbhsX6/3e2d44f022ce6d619ea9d7f03b0f9f9e-removebg-preview.png',
        'https://i.ibb.co/TqKY4rN9/4d5808a21529f7d27ced92a4c0bdfaf3-removebg-preview.png',
        'https://i.ibb.co/mrbTLpcz/70097d2e29d2f495ebffe7805c8f8f17-removebg-preview.png',
        'https://i.ibb.co/mrHGptY0/855163cfed39fd7f0f46988539daeb30-removebg-preview.png',
        'https://i.ibb.co/p6wDdCkB/a6b88336cb6995ef3449d8ec088b0a0e-removebg-preview.png',
        'https://i.ibb.co/GjdHKF9/da20b91e447ab3dd219d0bbc264dc586-removebg-preview.png',
        'https://i.ibb.co/S79sXZt0/e05dc80e23e916bfb6968211dc386b66-removebg-preview.png',
        'https://i.ibb.co/Mys3V7cC/f5a874ba0499b91ab7e848d5b6e682d7-removebg-preview.png' 
    ],
    'Chân váy (Skirt)': [
        'https://i.ibb.co/HDVt30hT/138e0849bd70c250e727c8de454cac1f-removebg-preview.png',
        'https://i.ibb.co/2YW81MDD/02c19ae157aab5fe2642a944442b57cd-removebg-preview.png',
        'https://i.ibb.co/F4nwDfnc/05b61260bdfe18a9a65e10f9a0dee566-removebg-preview.png',
        'https://i.ibb.co/nMwprw0B/1383f10d0c0200a55a38fc1e5f9cecba-removebg-preview.png',
        'https://i.ibb.co/KpGwV7kR/1572574cab5fb1c7f21934986480618a-removebg-preview.png',
        'https://i.ibb.co/1GxkN0ns/1d2f026eb31fad274210e445460f8e7c-removebg-preview.png',
        'https://i.ibb.co/4nyY4dgb/2985bacd8c8f56994ef61606cbcbfe13-removebg-preview.png',
        'https://i.ibb.co/F4W4tpmG/2f3c82930f4f02858f3f0a6f4326dae9-removebg-preview.png',
        'https://i.ibb.co/Y4DvKLbR/412e046e27e6f423b3a2289eff6fd0cc-removebg-preview.png',
        'https://i.ibb.co/RGY92GhN/42edf9b7a9afb254428e65035955da37-removebg-preview.png',
        'https://i.ibb.co/mVJyZVj0/777f86b869b751e7cc676db488c8e147-removebg-preview.png',
        'https://i.ibb.co/HLGTgBp8/a4a887353d9f1a8bdecb432100892ae5-removebg-preview.png',
        'https://i.ibb.co/qF7VfDX4/c343cb233e2432d0338560bc4e9b7c97-removebg-preview.png',
        'https://i.ibb.co/VWZVMfXH/ca1ebb61c6154501ebe4049922bd8dbe-removebg-preview.png',
        'https://i.ibb.co/zHtb4rnh/da499ede6283420aae9c82c65a9189a4-removebg-preview.png',
        'https://i.ibb.co/KjD4LHn0/e67870a9e191ef37d6456fc1db7050d1-removebg-preview.png' 
    ],
    'Áo len/Nỉ': [
        'https://i.ibb.co/3yHTsTBS/5902eb0c3e86a20acc68d008e0426d21-removebg-preview.png',
        'https://i.ibb.co/6Rct4ShL/a76215c2df245ffa131f809d7d0ec41f-removebg-preview.png',
        'https://i.ibb.co/5hYzvLDJ/af9fd68ff4dce2cc724c7ac46afd1935-removebg-preview.png',
        'https://i.ibb.co/nqPMCcfd/1bd97f1046d8a5f3d2d4b35d3f6ddaa3-removebg-preview.png',
        'https://i.ibb.co/TMhWNXgN/1db6e13f9750e0dcbbcbb771aad75bd1-removebg-preview.png,',
        'https://i.ibb.co/JRdF6pPR/6aa427b17c5b0782f73cd8d6ad8e2c65-removebg-preview.png',
        'https://i.ibb.co/9mL5KFvJ/7a2c9854cdfa5025d20e0361d2c43d55-removebg-preview.png',
        'https://i.ibb.co/R4Pn69x7/27e22dae78c3c0ac0d309bc1f90fbb72-removebg-preview.png',
        'https://i.ibb.co/S4Tbc58c/38cb8e152738b3af0c81f2a0c68d1e5c-removebg-preview.png',
        'https://i.ibb.co/yn02qt1Q/72e31c4010b1e4df4ae18b2c8e743280-removebg-preview.png',
        'https://i.ibb.co/VcyM571r/c768f274e3a099c23ba1859c05d92df3-removebg-preview.png',
        'https://i.ibb.co/R4pYSL6S/d43a0d8d55ea39d874c2a494990b76d3-removebg-preview.png'
    ],
    'Áo khoác (Jacket/Coat)': [
        'https://i.ibb.co/1YRC5HXF/ba58318a41d3868743f60e9438a9d66e-removebg-preview.png',
        'https://i.ibb.co/qYSfKPxL/c3dfa0bfe8ee8b5592d8aa03026216e8-removebg-preview.png',
        'https://i.ibb.co/JRWdYc8G/e95028112d1267b222496062feb6b567-removebg-preview.png',
        'https://i.ibb.co/zW125WJ5/1f374ededab584c39540d260d3785d27-removebg-preview.png',
        'https://i.ibb.co/hR4cztNr/9a2f28102f31ade82f2ea5c5f90bf955-removebg-preview.png',
        'https://i.ibb.co/zTqm07VN/51e7c03ecb60d923b8630f0ba0b0af5d-removebg-preview.png',
        'https://i.ibb.co/9HWn8Fvg/81e7af8e0cf7e62cdefa99f450f5a266-removebg-preview.png',
        'https://i.ibb.co/gM0PFTrv/330b1be033d4904f87216d79a3d20d87-removebg-preview.png',
        'https://i.ibb.co/wN2fgHXg/15120e1599e4a9750013d61ee7d232ba-removebg-preview.png',
        'https://i.ibb.co/svBhrMtm/831990c5d66ce0af3c3fbac097308adb-removebg-preview.png',
        'https://i.ibb.co/BKGZGTkp/a041d97661c044a36a11c0043987bd28-removebg-preview.png',
        'https://i.ibb.co/7xHbbmgk/b49c50588cc3d3066021e936c54ba0f6-removebg-preview.png'
    ],
    'Quần ngắn (Shorts)': [
        'https://i.ibb.co/21SM7PY7/0324786f1f487aaabb11350a40dd1ff4-removebg-preview.png',
        'https://i.ibb.co/7NGnkwz1/03436e3950eefe1490eea3bcbe7f94bc-removebg-preview.png',
        'https://i.ibb.co/7tqmKJcY/169b6b7216910540c7362f8d8d6596bc-removebg-preview.png',
        'https://i.ibb.co/dJt1LLxZ/425e4d1e70611ec7d7fdf0e8ece35d30-removebg-preview.png',
        'https://i.ibb.co/PvXZskr6/515e60032e57ee595fa91e956e409f01-removebg-preview.png',
        'https://i.ibb.co/b5m4XmWn/7fc83d13bfa722e36ac4f38a298c4b49-removebg-preview.png',
        'https://i.ibb.co/5X3tykwh/81a4f581f9bd9adcaf061c7c5a13f2a4-removebg-preview.png',
        'https://i.ibb.co/tWX1ZL2/a1c36a276011f6949ec7bd912d1de549-removebg-preview.png',
        'https://i.ibb.co/whHJtKYC/b34e923d9fe45f1a6680fee70e2ad303-removebg-preview.png',
        'https://i.ibb.co/Fk7hfqk9/eb7f6b9365536d07287cdc22572b3837-removebg-preview.png',
        'https://i.ibb.co/kgcVYrm6/f60fe82294cb5f4915caff6eaf278b73-removebg-preview.png',
        'https://i.ibb.co/CpX73z1T/f7f262cf57ed18995286f87b4cfef48b-removebg-preview.png',
        'https://i.ibb.co/WvcMcjJh/t-i-xu-ng-removebg-preview.png',
        'https://i.ibb.co/7tqmKJcY/169b6b7216910540c7362f8d8d6596bc-removebg-preview.png',
        'https://i.ibb.co/jPbStn7j/Alanui.jpg'
    ],
    'Giày/Dép': [
        'https://i.ibb.co/RpcrNCZF/1687aee4bda8b2cf51057544bed36bd6-removebg-preview.png',
        'https://i.ibb.co/qMpFqwxD/458e13ed3b9fa68782c29d8a3d041184-removebg-preview.png',
        'https://i.ibb.co/pvQjPGSW/5382915c300cb6c08e026ae480a8e202-removebg-preview.png',
        'https://i.ibb.co/ch139pxp/73c4a55d1d0f196d62c9da17fa3cd7ee-removebg-preview.png',
        'https://i.ibb.co/BVSmHD7C/79188158d26f038b838dc8d517a91b94-removebg-preview.png',
        'https://i.ibb.co/kkX1Fjx/a2b631e0c0baf844f16241a93db4e566-removebg-preview.png',
        'https://i.ibb.co/dqX2zC7/e0a4fbdfc0240d240626fdaa2b340a75-removebg-preview.png',
        'https://i.ibb.co/h1MS6vXc/ef39b12beaa1a3e927fff63c763bf8c6-removebg-preview.png',
        'https://i.ibb.co/8LPq0JVX/f01350c9d015be3be6b31b0287902d99-removebg-preview.png'
    ],
    'Túi xách/Balo': [
        'https://i.ibb.co/Qv62kSJR/0ae84a9619e67c59b2a7e89e0ee03210-removebg-preview.png',
        'https://i.ibb.co/W4vJHz60/5be9890c0fab884102711c54d30a1b38-removebg-preview.png',
        'https://i.ibb.co/dJBNZfH5/5c1170a3614e918144e8967ac732d660-removebg-preview.png',
        'https://i.ibb.co/dSpyQXc/6cff60dd4c7079bdcb885623db984833-removebg-preview.png',
        'https://i.ibb.co/kVQ46mjn/7e76c8f155716d76fc687b124a6a8ac4-removebg-preview.png',
        'https://i.ibb.co/KpqTby1h/8aec883f45b70618f6c894925b4fb82f-removebg-preview-1.png',
        'https://i.ibb.co/gbLthW9P/b02cfadffc1207d3ac731dbf61a1382a-removebg-preview.png',
        'https://i.ibb.co/sdyN1vmM/c67f41d23a4b26c2d4c7ecfeb1cbe3c3-removebg-preview.png',
        'https://i.ibb.co/mFPQF4sB/dc7ade1b9e8573ab40f522430f54e020-removebg-preview.png',
        'https://i.ibb.co/Q3hycCHL/eb951c21b7a84ea37e8d3cab680c2129-removebg-preview-1.png',
        'https://i.ibb.co/V0S41fXm/62251243ebfb842325f9c3b890cc599a-removebg-preview.png',
        'https://i.ibb.co/zHPRdVxK/993829148db9cff16dc123592e5ab83a-removebg-preview.png',
        'https://i.ibb.co/Q71ZBNFm/ee180ed9468f1a9d4b500789d871159a-removebg-preview.png',
        'https://i.ibb.co/YTZ9jDZm/f2c56d68ecda22132ff882f2daca6baa-removebg-preview.png'
    ],
    'Phụ kiện (Mũ, Kính, Trang sức)': [
        'https://i.ibb.co/JjH6hQJ5/180e6b1e8a44453fca5c14260a111ec2-removebg-preview.png',
        'https://i.ibb.co/9k17LPpt/2cb0a26a9ef9a59bc309531cc89730ff-removebg-preview.png',
        'https://i.ibb.co/5hZk4wh3/5ffadbe4825ae27ef691f30c526af2fe-removebg-preview.png',
        'https://i.ibb.co/B20ddqYZ/68776c794258a7b78d67865c0a653739-removebg-preview.png',
        'https://i.ibb.co/zHBgTCfN/84d4da47d628e4ec76692ea5802d4b49-removebg-preview.png',
        'https://i.ibb.co/QjHtLTHJ/89eaee3c1a7561018364af6817f5e656-removebg-preview.png',
        'https://i.ibb.co/N6X75Pjm/9246509c4d30221bb0a9ba4d8b4c1c46-removebg-preview.png',
        'https://i.ibb.co/1tKqGvtJ/97bd0290e6391509b48fa43390d31f91-removebg-preview.png',
        'https://i.ibb.co/kLKGBsx/adb71b8952cb100fec51be4f27d9e48d-removebg-preview-1.png',
        'https://i.ibb.co/gZHZsksb/ba7c95f9497eff2014038f4706d728d0-removebg-preview.png',
        'https://i.ibb.co/zTPhcQvC/bc5c8ac2a8e9a2668679ce330c6be589-removebg-preview.png',
        'https://i.ibb.co/mrHz8nbZ/db42579b5ae0d4f68564a72249c6ea7c-removebg-preview.png',
        'https://i.ibb.co/8DP3wrbP/e00b09e88d2f73f579a70b1a50c6a54e-removebg-preview.png',
        'https://i.ibb.co/0pz21JvF/e1ae066f1249cb917b0c29b14e77baba-removebg-preview.png',
        'https://i.ibb.co/JW07wFDp/eca7bb287c52847f76e7a492f683a015-removebg-preview.png',
        'https://i.ibb.co/xtFNvR98/fb35c83169c4e511744cfd3eef4a2c78-removebg-preview.png',
        'https://i.ibb.co/vC6pwWJ6/8be970a6f656b6a0fdb0b589b368cb61-removebg-preview.png',
        'https://i.ibb.co/XxQpWwDz/0625a33787f1eb0e08308808c5f9bb20-removebg-preview.png',
        'https://i.ibb.co/1tKqGvtJ/97bd0290e6391509b48fa43390d31f91-removebg-preview.png',
        'https://i.ibb.co/JjH6hQJ5/180e6b1e8a44453fca5c14260a111ec2-removebg-preview.png',
        'https://i.ibb.co/6RnHc0sn/9353e71f7e7f9866cdab73ec62d9e065-removebg-preview.png'
    ],
    'Đồ thể thao/Bơi': [
        'https://i.pinimg.com/originals/6d/92/c0/6d92c0c427259e33c735676b8d3a0f6c.png',
        'https://i.pinimg.com/originals/22/1b/1b/221b1bec4840d71a6b82ddbba1853e09.png',
        'https://i.pinimg.com/originals/a1/db/ff/a1dbff68516b74667aa96e367d10435f.png',
    ],
    'DEFAULT': [
        'https://images.unsplash.com/photo-1434389670869-c8873cb58c85?w=500&q=80',
        'https://images.unsplash.com/photo-1550639524-a6f58345a278?w=500&q=80'
    ]
};

// =====================================================================
// 🟢 TỪ ĐIỂN MAP LINK SHOPEE CHUẨN THEO DANH MỤC
// Khi chạy thuật toán tạo data, nó sẽ đối chiếu tên danh mục vào đây để lấy đúng link
// =====================================================================
const CATEGORY_TO_SHOPEE_LINK = {
    'Áo thun/T-shirt': 'https://shopee.vn/search?keyword=%C3%A1o%20thun',
    'Áo sơ mi/Blouse': 'https://shopee.vn/search?keyword=%C3%A1o%20s%C6%A1%20mi',
    'Áo len/Nỉ': 'https://shopee.vn/search?keyword=%C3%A1o%20len%20n%E1%BB%89',
    'Áo khoác (Jacket/Coat)': 'https://shopee.vn/search?keyword=%C3%A1o%20kho%C3%A1c',
    'Quần dài (Jeans/Trousers)': 'https://shopee.vn/search?keyword=qu%E1%BA%A7n%20d%C3%A0i',
    'Quần ngắn (Shorts)': 'https://shopee.vn/search?keyword=qu%E1%BA%A7n%20ng%E1%BA%AFn',
    'Váy/Đầm (Dress)': 'https://shopee.vn/search?keyword=v%C3%A1y%20%C4%91%E1%BA%A7m',
    'Chân váy (Skirt)': 'https://shopee.vn/search?keyword=ch%C3%A2n%20v%C3%A1y',
    'Giày/Dép': 'https://shopee.vn/search?keyword=gi%C3%A0y%20d%C3%A9p',
    'Túi xách/Balo': 'https://shopee.vn/search?keyword=t%C3%BAi%20x%C3%A1ch',
    'Phụ kiện (Mũ, Kính, Trang sức)': 'https://shopee.vn/search?keyword=ph%E1%BB%A5%20ki%E1%BB%87n%20th%E1%BB%9Di%20trang',
    'Đồ thể thao/Bơi': 'https://shopee.vn/search?keyword=%C4%91%E1%BB%93%20th%E1%BB%83%20thao'
};

const shuffleArray = (array) => {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

async function main() {
    console.log('🚀 Bắt đầu gieo hạt (Seed) với Thuật toán Xào Bài Tổng...');

    await prisma.publicItem.deleteMany(); 

    console.log('👗 Đang kiểm tra và nạp Danh mục Quần Áo (Categories)...');
    const categoriesToSeed = [
        { name: 'Áo thun/T-shirt', iconUrl: 'https://cdn-icons-png.flaticon.com/512/863/863684.png' },
        { name: 'Áo sơ mi/Blouse', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2806/2806051.png' },
        { name: 'Áo len/Nỉ', iconUrl: 'https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/11/ao-ni-sweater-mlb-basic-small-logo-overfit-fleece-man-to-man-new-york-mets-3amtb0646-09mgs-mau-ghi-673167aac4fa0-11112024091050.jpg' },
        { name: 'Áo khoác (Jacket/Coat)', iconUrl: 'https://img.pikbest.com/wp/202413/outline-sketch-drawing-of-a-boy-s-jacket-vector_10475550.jpg!sw800' },
        { name: 'Quần dài (Jeans/Trousers)', iconUrl: 'https://img.icons8.com/?size=100&id=1172&format=png&color=000000' },
        { name: 'Quần ngắn (Shorts)', iconUrl: 'https://img.icons8.com/ios/100/shorts.png' },
        { name: 'Váy/Đầm (Dress)', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1785/1785255.png' },
        { name: 'Chân váy (Skirt)', iconUrl: 'https://thumb.silhouette-ac.com/t/37/37120be0ec7335db9f18a706e3ac4f6d_t.jpeg' },
        { name: 'Giày/Dép', iconUrl: 'https://thumb.silhouette-ac.com/t/33/3359cdc20d49f36847317c069b7ce48c_t.jpeg' },
        { name: 'Túi xách/Balo', iconUrl: 'https://smartones.com.vn/wp-content/uploads/2021/05/pngtree-backpack-icon-design-template-vector-isolated-png-image-746869.jpeg' },
        { name: 'Phụ kiện (Mũ, Kính, Trang sức)', iconUrl: 'https://topsi.vn/uploads/images/categories/4n5ASq1liPZkX3amjYwRgfehK0PHab22q2uYhDlt.png' },
        { name: 'Đồ thể thao/Bơi', iconUrl: 'https://cdn.shopify.com/s/files/1/0456/5070/6581/files/8-135410001-1_540x.jpg?v=1705468799' }
    ];

    for (const cat of categoriesToSeed) {
        const existingCat = await prisma.category.findFirst({ where: { name: cat.name } });
        if (!existingCat) {
            await prisma.category.create({ data: cat });
        }
    }

    console.log('🏷️ Đang kiểm tra và nạp bộ Thẻ phân loại (Tags)...');
    const tagsToSeed = [
        { name: 'Đi học', type: 'Hoàn cảnh' }, { name: 'Công sở/Đi làm', type: 'Hoàn cảnh' },
        { name: 'Dạo phố/Cafe', type: 'Hoàn cảnh' }, { name: 'Hẹn hò lãng mạn', type: 'Hoàn cảnh' },
        { name: 'Tiệc tùng/Sự kiện', type: 'Hoàn cảnh' }, { name: 'Tập thể thao', type: 'Hoàn cảnh' },
        { name: 'Du lịch/Đi biển', type: 'Hoàn cảnh' }, { name: 'Mặc nhà/Thư giãn', type: 'Hoàn cảnh' },
        { name: 'Nắng nóng (>30°C)', type: 'Thời tiết' }, { name: 'Mát mẻ (Mùa thu/Xuân)', type: 'Thời tiết' },
        { name: 'Se lạnh (15-22°C)', type: 'Thời tiết' }, { name: 'Rét đậm (Mùa đông)', type: 'Thời tiết' },
        { name: 'Trời mưa', type: 'Thời tiết' }, { name: 'Tối giản (Minimalism)', type: 'Phong cách' },
        { name: 'Năng động (Sporty/Casual)', type: 'Phong cách' }, { name: 'Thanh lịch (Elegant)', type: 'Phong cách' },
        { name: 'Cổ điển (Vintage/Retro)', type: 'Phong cách' }, { name: 'Đường phố (Streetwear)', type: 'Phong cách' },
        { name: 'Ngọt ngào/Nữ tính', type: 'Phong cách' }, { name: 'Cá tính/Phá cách (Edgy)', type: 'Phong cách' },
        { name: 'Tông Đen/Trắng', type: 'Màu sắc' }, { name: 'Tông Nâu/Be/Earth', type: 'Màu sắc' },
        { name: 'Tông Pastel (Nhạt)', type: 'Màu sắc' }, { name: 'Tông Nổi bật (Neon/Đỏ)', type: 'Màu sắc' }
    ];

    for (const tag of tagsToSeed) {
        await prisma.tag.upsert({
            where: { name: tag.name },
            update: { type: tag.type },
            create: { name: tag.name, type: tag.type }
        });
    }

    const allTagsDb = await prisma.tag.findMany(); 

    console.log('🎁 Đang lên danh sách đồ đạc theo từng danh mục chuẩn...');
    
    let publicItemsData = [];
    const styleAdjectives = ["Basic", "Vintage", "Thanh lịch", "Năng động", "Hàn Quốc", "Tối giản", "Cao cấp", "Oversize", "Retro", "Phá cách"];
    const materials = ["Cotton 100%", "Lụa tơ tằm mềm mại", "Denim cao cấp", "Vải Linen thoáng mát", "Kaki đứng form", "Vải tổng hợp"];
    const colors = ["Đen", "Trắng", "Xanh Navy", "Be", "Đỏ đô", "Xám", "Nâu", "Pastel"];
    const cares = ["Giặt máy chế độ nhẹ", "Khuyên dùng giặt tay", "Không sử dụng chất tẩy mạnh", "Phơi trong bóng râm", "Giặt khô"];

    for (const cat of categoriesToSeed) {
        const dbCategory = await prisma.category.findFirst({ where: { name: cat.name } });
        
        if (dbCategory) {
            const categoryImages = IMAGE_BANK[cat.name] || IMAGE_BANK['DEFAULT'];
            const itemCount = categoryImages.length; 
            let shuffledDeck = shuffleArray(categoryImages);

            for (let i = 0; i < itemCount; i++) {
                const currentImg = shuffledDeck[i];
                const shortCatName = cat.name.split('/')[0]; 
                const randomAdj = styleAdjectives[Math.floor(Math.random() * styleAdjectives.length)];

                const isShoes = cat.name.includes("Giày") || cat.name.includes("Dép");
                const itemSize = isShoes ? "38, 39, 40, 41" : "S, M, L, XL, Freesize";
                
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                const randomMaterial = materials[Math.floor(Math.random() * materials.length)];
                const randomCare = cares[Math.floor(Math.random() * cares.length)];

                const shuffledTags = shuffleArray(allTagsDb);
                const randomTagIds = [shuffledTags[0].id, shuffledTags[1].id];
                
                // 🟢 ĐIỂM ĂN TIỀN LÀ ĐÂY: Ánh xạ link theo đúng danh mục, nếu không có thì mặc định về trang chủ Shopee
                const mappedShopeeLink = CATEGORY_TO_SHOPEE_LINK[cat.name] || 'https://shopee.vn/';

                publicItemsData.push({
                    name: `${shortCatName} ${randomAdj}`,
                    imageUrl: currentImg,
                    categoryId: dbCategory.id,
                    size: itemSize,
                    color: randomColor,
                    material: randomMaterial,
                    careInstructions: randomCare,
                    notes: "Sản phẩm gợi ý mua sắm chính hãng, chất lượng đảm bảo.",
                    affiliateUrl: mappedShopeeLink,
                    tagIds: randomTagIds 
                });
            }
        }
    }

    console.log('🌪️ Đang xáo trộn mớ đồ lên để tab "Tất cả" hiện ngẫu nhiên...');
    publicItemsData = shuffleArray(publicItemsData);

    await prisma.publicItem.createMany({ data: publicItemsData });
    console.log(`✅ Đã nạp thành công ${publicItemsData.length} món đồ Affiliate siêu xịn!`);

    console.log('🧍 Đang xóa dữ liệu cũ và nạp Cẩm nang Dáng người...');
    await prisma.bodyShapeGuide.deleteMany();

    const bodyShapesToSeed = [
        {
            shapeName: 'Dáng Quả Lê (Pear)',
            description: 'Phần vai và ngực nhỏ, hông và đùi nở nang. Trọng lượng dồn nhiều vào phần dưới cơ thể, tạo thành hình tam giác thuận.',
            stylingAdvice: JSON.stringify({
                advantages: ["Đường cong phần hông quyến rũ, cực kỳ nữ tính.", "Vòng eo thon gọn, tạo điểm nhấn rõ nét."],
                toWear: [
                    { title: "Cổ chữ V", desc: "Kéo dài và giúp thân trên thanh thoát hơn." },
                    { title: "Áo bèo nhún/độn vai", desc: "Tạo cảm giác vai đầy đặn, cân bằng với hông." },
                    { title: "Chân váy chữ A", desc: "Xòe nhẹ phần dưới, che khuyết điểm đùi to." },
                    { title: "Quần ống suông", desc: "Tạo tỷ lệ cơ thể cân đối và kéo dài chân." }
                ],
                toAvoid: ["Quần Skinny bó sát làm lộ nhược điểm hông to.", "Chân váy bút chì sáng màu làm phần thân dưới trông nặng nề hơn."]
            }),
            illustrationUrl: 'https://img2.dilyno.com/SnCYc0f5ttspv62sT5wo9aCRIyPLz1qJ9Zb8-wDqpxw/rs:fill:428:800:0/aHR0cHM6Ly9zMy1kaWx5LXdlYi5kaWx5bm8uY29tL3dlYmVjb20vMjAyMy8wNC8yNzk4MDM2YTEyZTAwZWQ0NjkxNWNlMWUwYjBiMjM2OS5qcGc.jpg'
        },
        {
            shapeName: 'Dáng Đồng Hồ Cát (Hourglass)',
            description: 'Tỷ lệ cơ thể lý tưởng với vai và hông cân đối, vòng eo nhỏ nhắn, rõ nét (nhỏ hơn hông/vai ít nhất 20cm).',
            stylingAdvice: JSON.stringify({
                advantages: ["Đường cong cơ thể mềm mại và nữ tính.", "Tỉ lệ vai và hông cân đối tự nhiên.", "Vòng eo rõ rệt là điểm nhấn đắt giá nhất."],
                toWear: [
                    { title: "Cổ chữ V", desc: "Giúp phần thân trên trông thanh thoát và thu hút." },
                    { title: "Thắt eo", desc: "Khoe trọn lợi thế vòng hai thon gọn." },
                    { title: "Chân váy bút chì", desc: "Tôn vinh đường cong hông quyến rũ." },
                    { title: "Áo Croptop", desc: "Tạo sự trẻ trung và nhấn vào phần eo." }
                ],
                toAvoid: ["Đồ quá rộng (Oversize) làm mất đường cong.", "Trang phục cổ thuyền cao làm vai trông thô hơn."]
            }),
            illustrationUrl: 'https://institute.htfitness.vn/wp-content/uploads/2024/08/hourglass-body-shape-of-womenhourglass-body-shape-of-women.jpg.webp'
        },
        {
            shapeName: 'Dáng Chữ Nhật (Rectangle)',
            description: 'Vai, eo và hông có kích thước gần bằng nhau, không có đường cong rõ rệt ở eo. Dáng người khỏe khoắn, thanh mảnh.',
            stylingAdvice: JSON.stringify({
                advantages: ["Dáng người thanh mảnh, cực kỳ dễ mặc nhiều kiểu đồ.", "Tỷ lệ cơ thể đều đặn, tạo cảm giác năng động, hiện đại."],
                toWear: [
                    { title: "Thắt eo/Rút dây", desc: "Tạo ảo giác vòng eo thon gọn, rõ nét." },
                    { title: "Đầm Peplum", desc: "Phần xòe ở hông tạo đường cong hoàn hảo." },
                    { title: "Phối đồ Layer", desc: "Mặc nhiều lớp (khoác ngoài) tạo sự mềm mại và chiều sâu." },
                    { title: "Chân váy xòe", desc: "Tạo cảm giác phần hông nở nang hơn." }
                ],
                toAvoid: ["Váy suông đuột làm cơ thể trông thẳng đứng, thô cứng.", "Trang phục ôm sát nguyên bộ làm lộ khuyết điểm thiếu đường cong."]
            }),
            illustrationUrl: 'https://pos.nvncdn.com/f06edc-11055/art/artCT/20191105_TCLpP8ZDJ9pEyt3sWU59888l.jpg'
        },
        {
            shapeName: 'Dáng Tam Giác Ngược (Inverted Triangle)',
            description: 'Bờ vai rộng, ngực nở nhưng phần eo và hông lại hẹp. Trọng lượng dồn vào thân trên.',
            stylingAdvice: JSON.stringify({
                advantages: ["Bờ vai rộng, khỏe khoắn và mặc đồ vest rất đẹp.", "Đôi chân thon dài là vũ khí lợi hại nhất."],
                toWear: [
                    { title: "Váy xòe bồng", desc: "Tạo cảm giác hông nở nang, cân bằng với vai." },
                    { title: "Quần ống rộng", desc: "Thu hút ánh nhìn xuống thân dưới." },
                    { title: "Áo cổ chữ V sâu", desc: "Làm dịu phần vai và kéo ánh nhìn xuống dưới." },
                    { title: "Màu sáng thân dưới", desc: "Giúp phần hông trông đầy đặn hơn." }
                ],
                toAvoid: ["Áo trễ vai hoặc áo độn vai làm vai trông to và thô hơn.", "Quần skinny bó sát làm lộ sự chênh lệch lớn giữa thân trên và dưới."]
            }),
            illustrationUrl: 'https://pos.nvncdn.com/790194-223281/art/artCT/20230507_MIiWvApe.png'
        },
        {
            shapeName: 'Dáng Quả Táo (Apple)',
            description: 'Vòng một và vòng hai khá đầy đặn, vai rộng nhưng bù lại đôi chân thường rất thon gọn và mảnh mai.',
            stylingAdvice: JSON.stringify({
                advantages: ["Đôi chân thon gọn, thanh mảnh.", "Vòng một đầy đặn, quyến rũ."],
                toWear: [
                    { title: "Đầm chữ A", desc: "Xòe từ chân ngực (Empire waist) giấu gọn vòng hai." },
                    { title: "Cổ chữ V", desc: "Kéo dài phần thân trên, tạo sự thanh thoát." },
                    { title: "Quần Short/Váy ngắn", desc: "Khoe triệt để đôi chân thon gọn." },
                    { title: "Áo dáng suông", desc: "Rộng rãi vừa phải, không bó vào bụng." }
                ],
                toAvoid: ["Áo thun ôm sát vòng bụng làm lộ khuyết điểm.", "Thắt lưng to bản ngang eo thu hút sự chú ý vào phần bụng."]
            }),
            illustrationUrl: 'https://pos.nvncdn.com/790194-223281/art/artCT/20230503_PMQO2IUq.png'
        }
    ];

    await prisma.bodyShapeGuide.createMany({ data: bodyShapesToSeed });
    console.log('✅ HOÀN TẤT! Đã nạp thành công kho đồ xịn xò vào Database.');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi Gieo hạt:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });