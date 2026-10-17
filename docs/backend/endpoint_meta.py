#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""endpoint_meta.py — 70 条接口的契约元数据（单一事实源）

API.md 与 openapi.yaml 均由本文件生成，保证两者与 src/api/index.js 三方一致。

字段说明：
  path      必须与 src/api/index.js 逐字一致（verify_paths.py 校验）
  domain    业务域，引用 DATABASE.md §2
  title     用途
  pages     消费该接口的页面（src/pages/ 实测）
  params    请求参数：[(来源, 字段, 类型, 必填, 说明)]  来源 ∈ {path,param,data}
  style     响应封装风格 A~E，引用 DATABASE.md §1
  resp      响应字段 [(字段, 类型, 说明)]
  tables    数据来源表，引用 DATABASE.md §8
  status    read | write
  impl      done（已设计） | todo（写操作待实现）
  note      补充说明
"""
# 响应风格：A裸数组 B标准分页 C精简分页 D单对象 E嵌套混合
E = {}

E['/index/getConfig'] = dict(
    domain='E 内容社区', title='全局配置（应用名/Logo/GM工会/费率）',
    pages='index/Index.vue:364, market/TradeUnion.vue:91', method='POST', auth=False,
    params=[('data', '无', '-', False, '页面调用 `api.getConfig({})`，无业务参数')],
    style='D', impl='done',
    resp=[('appName', 'string', '应用名'), ('appLogo', 'string', 'Logo URL'),
          ('trade_union', 'object', 'GM工会入口 `{unlock,member_count,rebate_holder,rebate_invited,rebate_extra,max_bind}`'),
          ('trade_rule', 'string', '交易规则富文本'), ('consignment_sales', 'null', '恒为 null（DATABASE.md §9）'),
          ('rate', 'string', '费率'), ('share_proportion_rate', 'string', '分成比例')],
    tables='app_configs(config_group=trade/basic), trade_unions', mock='getConfig.json')

E['/banner/show/getBanner'] = dict(
    domain='E 内容社区', title='首页轮播图', pages='index/Index.vue:308(经 utils fetchBanner)',
    method='POST', auth=False,
    params=[('data', 'type', 'integer', False, 'Index.vue L310 传 `{type:1}`；utils 层不传')],
    style='B', impl='done',
    resp=[('total', 'integer', '总数'), ('per_page', 'integer', '每页数'),
          ('current_page', 'integer', '当前页'), ('last_page', 'integer', '总页数'),
          ('data', 'array', '`{id,image,url,url_type,is_show}`；url_type 枚举待确认')],
    tables='banners', mock='banner_show_getBanner.json')

E['/index/afficheList'] = dict(
    domain='E 内容社区', title='公告列表（分页）',
    pages='notice/Notice.vue:138, notice/Search.vue:120/141, market/MarketGoodsList.vue:203', method='POST', auth=False,
    params=[('data', 'page', 'integer', True, '页码，实参 `page:1`，从 1 起'),
            ('data', 'list_rows', 'integer', False, '每页条数，实参 `list_rows:30/15`；亦接受 `limit`（见 ARCHITECTURE §6.3）'),
            ('data', 'type', 'string', False, '公告类型，对应 affichetypelist 的 type；Search.vue 经 params 透传')],
    style='B', impl='done',
    resp=[('total', 'integer', '总数'), ('per_page', 'string', '每页数（源站为字符串，保留）'),
          ('current_page', 'integer', '当前页'), ('last_page', 'integer', '总页数'),
          ('data', 'array', '`{id,image,title,createtime,type,url,view_count,affiche_type}`；view_count 列表接口恒 0（DATABASE.md §9）')],
    tables='affiches, affiche_types', mock='afficheList.json')

E['/index/affichetypelist'] = dict(
    domain='E 内容社区', title='公告类型列表', pages='notice/Notice.vue:134/154', method='POST', auth=False,
    params=[('data', '无', '-', False, '页面无实参')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,name}`，实测 7 条')],
    tables='affiche_types', mock='affichetypelist.json')

E['/index/getSeries'] = dict(
    domain='B 藏品与系列', title='系列列表（支持 pid 查子系列）',
    pages='market/Market.vue:262(`{type:10}`) /263(`{type:10,pid:10}`); utils fetchSeries/fetchSeriesPid', method='POST', auth=False,
    params=[('param', 'type', 'integer', True, '系列类型，实测恒 10；走 query string（api 对象用 param）'),
            ('param', 'pid', 'integer', False, '父系列 id，缺省取顶级系列')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{series_name,series_id,is_def,flag,pattern,resale_put_start_time,resale_put_end_time,resale_buy_start_time,resale_buy_end_time}`')],
    tables='series', mock='series-10.json（pid 变体：series-10-pid.json）')

E['/index/afficheDetail'] = dict(
    domain='E 内容社区', title='公告详情（含关联藏品）', pages='notice/NoticeDetails.vue:77（实参 `{}`）',
    method='POST', auth=False,
    params=[('data', 'id', 'integer', False, '**待确认**：页面传空对象，实际经路由 query 传入；见 note')],
    style='D', impl='done',
    resp=[('id', 'integer', '公告 id'), ('title', 'string', '标题'), ('affiche_type', 'string', '类型'),
          ('publish_time', 'string', '发布时间'), ('createtime', 'integer', '时间戳'),
          ('view_count', 'integer', '浏览量（仅详情接口有真实值）'), ('content', 'string', '富文本正文'),
          ('collection', 'array', '关联藏品 `[{id,name,listimg,price}]`')],
    tables='affiches', mock='noticeDetails.json',
    note='页面 L77 传 `{}`，但 NoticeDetails 为路由页，id 应来自 `route.query.id`。参数名与传递方式待前端确认。')

E['/index/newsDetail'] = dict(
    domain='E 内容社区', title='潮玩有话说详情', pages='notice/NewsDetails.vue:58（实参 `{}`）', method='POST', auth=False,
    params=[('data', 'id', 'integer', False, '**待确认**：同/afficheDetail')],
    style='D', impl='done',
    resp=[('id', 'integer', 'id'), ('title', 'string', '标题'), ('createtime', 'integer', '时间戳'), ('content', 'string', '正文')],
    tables='news_articles', mock='newsDetails.json',
    note='页面传空对象，id 疑似来自 route.query，待确认。')

E['/addons/diypage/index'] = dict(
    domain='E 内容社区', title='装修页组件配置', pages='index/Index.vue:364（`api.diypage()`）', method='POST', auth=False,
    params=[('data', '无', '-', False, '`api.diypage()` 固定传 `data:{}`')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,type,category,name,content,decorate_id}`；content 为前端布局 DSL，须原样存 TEXT（DATABASE.md §1）')],
    tables='diypage_components', mock='diypage.json',
    note='MOCK_MAP 中另有脏键 `/addons_diypage_index`（误登记文件名，非路径），须清理。见 ARCHITECTURE §10。')

E['/market/market/getMarketList'] = dict(
    domain='C 交易与订单', title='市场藏品列表',
    pages='index/Index.vue:317(`{page:1,list_rows:1,goods_type:2}`), market/Market.vue:237(`{page:1,list_rows:20,series_id}`), market/Search.vue:120(`{}`)',
    method='POST', auth=False,
    params=[('data', 'page', 'integer', True, '页码，从 1 起'),
            ('data', 'list_rows', 'integer', False, '每页条数；亦接受 `limit`'),
            ('data', 'series_id', 'integer', False, '按系列筛选，Market.vue 传当前选中系列'),
            ('data', 'goods_type', 'integer', False, '商品类型：1=盲盒 2=单品（DATABASE.md §4 E-GOODS-TYPE-COLLECTION）')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{name,series_id,id,listimg,total_num,reprice_limit,collection_level,openresale_time,flag,select_status,deal_num,flux,is_like,market_fluctuate_new,market_value,market_fluctuate,min_price,is_out,new_time,goods_type,product{id,name,listimg,total_num}}`；goods_type 为字符串形态（DATABASE.md §6.2 脏数据）')],
    tables='product_market_stats, products', mock='marketList.json')

E['/market/market/MarketDetail/ids/{id}'] = dict(
    domain='C 交易与订单', title='藏品/市场详情', pages='market/Detail.vue:257, market/BatchPay.vue:178, order/OrderSubmit.vue:206, utils fetchTradeBaseInfo（默认 id=226）',
    method='POST', auth=False,
    params=[('path', 'id', 'integer', True, '藏品 id，嵌在路径中（`/ids/{id}`）；`api.getMarketDetails(id)` 用模板字符串拼接')],
    style='D', impl='done',
    resp=[('id', 'integer', 'id'), ('name', 'string', '藏品名'), ('goods_type', 'integer', '商品类型'),
          ('price', 'string', '当前售价（字符串金额，DATABASE.md §6.4）'), ('listimg', 'string', '列表图'),
          ('product', 'object', '`{id,name,listimg,total_num,publisher{name,user},collectionlist[],imageinfo[],issuer}`；imageinfo/issuer 恒空（§9）'),
          ('user_collection', 'object', '持有者信息，含 `user_hash`（可能为脱敏值，§6.3）')],
    tables='market_listings, products, user_collections, users', mock='marketDetail.json',
    note='唯一动态路径。Express 路由注册为 `/market/market/MarketDetail/ids/:id`。localRequest 用正则匹配此路径。')

E['/market/market/seriesGoodsList'] = dict(
    domain='B 藏品与系列', title='某系列下的商品列表',
    pages='market/MarketGoodsList.vue:202（`{id, type: route.query.goodsType || 2}`）', method='POST', auth=False,
    params=[('data', 'id', 'integer', True, '系列 id（页面实参 `id` 来自路由/选中系列）'),
            ('data', 'type', 'integer', False, '商品类型：1=盲盒 2=单品，默认 2')],
    style='E', impl='done',
    resp=[('product', 'object', '`{id,name,total_num,flux,is_like,batch_pay,collection_level,listimg,issuer,introduce_image}`'),
          ('total', 'integer', '总数'), ('current_page', 'integer', '当前页'), ('last_page', 'integer', '总页数'),
          ('data', 'array', '`{id,name,collection_code,min_price,status,income_type,createtime,listimg}`；income_type 为数组形态（§6.2）')],
    tables='market_listings, products, product_pool_items', mock='marketGoodsList.json',
    note='风格 E：product 对象与 data 列表并存。参数名 `id` 指系列 id 而非商品 id，易误读，已按页面实参记录。')

E['/product/product/detail'] = dict(
    domain='B 藏品与系列', title='商品详情（盲盒/藏品通用）',
    pages='product/Box.vue:142(`{id: route.query.id || 226}`), product/Collection.vue:77（同）', method='POST', auth=False,
    params=[('data', 'id', 'integer', True, '商品 id，页面默认 226')],
    style='D', impl='done',
    resp=[('id', 'integer', 'id'), ('goods_type', 'integer', '1=盲盒 2=单品'), ('name', 'string', '名称'),
          ('price', 'string', '价格'), ('sale_status', 'integer', '销售状态'), ('is_shengou', 'integer', '是否申购'),
          ('is_sub', 'integer', '是否订阅'), ('shengou', 'object', '申购配置 `{num,user_num,start_time,end_time}`'),
          ('count_down', 'integer', '倒计时'), ('introduce', 'string', '介绍'),
          ('product', 'object', '`{id,name,goods_type,listimg,main_image,total_num,sale_total_num,flux,is_like,is_sub,collectionlist[],publisher{name,user},series{id,name}}`')],
    tables='products, product_pool_items', mock='productDetail.json')

E['/product/product/rule'] = dict(
    domain='B 藏品与系列', title='申购/购买规则', pages='product/RuleDetail.vue:95（`{id: route.query.id || 226}`）',
    method='POST', auth=False,
    params=[('data', 'id', 'integer', True, '商品 id，默认 226')],
    style='D', impl='done',
    resp=[('id', 'integer', 'id'), ('name', 'string', '名称'), ('price', 'string', '价格'),
          ('total_num', 'integer', '总量'), ('sale_num', 'integer', '已售'), ('rule_updated', 'string', '规则更新时间'),
          ('rules', 'array', '`[{icon,title,lines[]}]`')],
    tables='product_sale_rules, products', mock='productRule.json')

E['/box/blind_box/list'] = dict(
    domain='D 活动与玩法', title='盲盒发售日历', pages='index/Index.vue:347（`api.blindBoxList(params)`，params 内容待确认）',
    method='POST', auth=False,
    params=[('data', '待确认', '-', False, 'Index.vue L347 传 `params` 变量，其定义需读 L340 附近；字段未在 api 层固定')],
    style='A', impl='done',
    resp=[('[]', 'array', '**实测为空数组**，无字段可列举（DATABASE.md §8 第 77/78 项）')],
    tables='（无数据，不入库）', mock='blindBoxList.json',
    note='mock 为空数组，响应字段结构**无mock 依据**，标待确认。实现时需按盲盒业务补齐或保持空数组。')

E['/user/login'] = dict(
    domain='A 用户与账户', title='登录', pages='login/Login.vue:85（`{account, password}`）', method='POST', auth=False,
    params=[('data', 'account', 'string', True, '账号（手机号或用户名），Login.vue 表单字段'),
            ('data', 'password', 'string', True, '密码（明文传输，须 HTTPS）')],
    style='D', impl='todo',
    resp=[('userinfo', 'object', '`{id,username,nickname,mobile,avatar,score,inviter_code,yao_count,huifu_service_charge,sandpay_service_charge,token}`')],
    tables='users（token 不入库，DATABASE.md §9）', mock='user.json（与getUserInfo 共用）',
    note='**TODO 写操作**。本轮返回含真实 JWT 的成功响应，不校验密码。token 字段是前端唯一凭证来源，必须真实可用（见 impl 说明）。')

E['/user/register'] = dict(
    domain='A 用户与账户', title='注册', pages='login/Register.vue（实参待确认）', method='POST', auth=False,
    params=[('data', 'mobile', 'string', False, '**待确认**：Register.vue 表单字段未逐项核'),
            ('data', 'password', 'string', False, '**待确认**'), ('data', 'code', 'string', False, '**待确认**：短信验证码')],
    style='D', impl='todo',
    resp=[('userinfo', 'object', '同 /user/login')],
    tables='users', mock='user.json',
    note='**TODO 写操作**。参数需前端补 Register.vue 实参后确认。')

E['/user/getUserInfo'] = dict(
    domain='A 用户与账户', title='当前登录用户信息',
    pages='my/Info.vue:92, my/Vip.vue:112, certification/Certification.vue:115, my/ActionPwdGetCode.vue:125', method='POST', auth=True,
    params=[('data', '无', '-', False, '用户身份全部来自 token')],
    style='D', impl='done',
    resp=[('userinfo', 'object', '同 /user/login；**本接口不应返回 token**（DATABASE.md §9）')],
    tables='users, user_sign_status(crystal_number)', mock='user.json')

E['/user/address/lists'] = dict(
    domain='A 用户与账户', title='收货地址列表', pages='my/AddressList.vue:75（`api.addressList()` 固定 `data:{}`）',
    method='POST', auth=True,
    params=[('data', '无', '-', False, '用户身份来自 token')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{address_id,name,mobile,province,city,area,address,is_default}`')],
    tables='user_addresses', mock='addressList.json')

E['/order/order/orderList'] = dict(
    domain='C 交易与订单', title='我的订单列表（分页）',
    pages='order/OrderList.vue:469（`{page:1, limit:15, type:1, status:0}`）', method='POST', auth=True,
    params=[('data', 'page', 'integer', True, '页码，从 1 起'),
            ('data', 'limit', 'integer', False, '每页条数，实参 15；本接口用 `limit` 而非 `list_rows`'),
            ('data', 'type', 'integer', False, '订单类型：实测 1=普通买单（DATABASE.md §8第 27 项 order_type=1）'),
            ('data', 'status', 'integer', False, '订单状态，枚举见 §4 E-ORDER-STATUS-BUY；实参 0')],
    style='B', impl='done',
    resp=[('total', 'integer', '总数'), ('per_page', 'integer', '每页数'), ('current_page', 'integer', '当前页'),
          ('last_page', 'integer', '总页数'),
          ('data', 'array', '`{id,order_sn,order_status,goods_id,goods_name,listimg,number,sale_number,price,total_price,income_type,createtime,updatetime,collection_code,user_hash_text}`')],
    tables='orders(order_type=1), products', mock='orderList.json')

E['/order/order/saleMarketOrderDetail'] = dict(
    domain='C 交易与订单', title='订单详情（常规/市场/转赠/委托/求购共用）',
    pages='order/OrderDetail.vue:348（`{id: route.query.id || 9001}`）', method='POST', auth=True,
    params=[('data', 'id', 'integer', True, '订单 id，默认 9001')],
    style='D', impl='done',
    resp=[('id', 'integer', 'id'), ('order_sn', 'string', '订单号'), ('order_status', 'integer', '订单状态'),
          ('goods_id', 'integer', '商品 id'), ('goods_name', 'string', '商品名'), ('listimg', 'string', '图'),
          ('collection_code', 'string', '藏品编号（可能为数字字符串，§6.1 三套编码体系）'),
          ('user_hash_text', 'string', '用户哈希（脱敏）'), ('pay_way', 'string', '支付方式，§4 E-PAY-WAY'),
          ('pay_name', 'string', '支付名称'), ('number', 'integer', '数量'), ('num', 'integer', '数量'),
          ('sale_number', 'integer', '已售数量'), ('price', 'string', '单价'), ('total_price', 'string', '总价'),
          ('order_amount', 'string', '订单金额'), ('discount_amount', 'string', '优惠金额'),
          ('pay_price', 'string', '应付金额'), ('remark', 'string', '备注'),
          ('createtime', 'integer', '创建时间'), ('updatetime', 'integer', '更新时间'),
          ('card', 'array', '**实测恒为空数组**，字段名无从得知（DATABASE.md §10 遗留项）'), ('goods_type', 'integer', '商品类型')],
    tables='orders, order_cards(空)', mock='orderDetail.json（与 begBuyOrderInfo 共用同一文件）')

E['/order/order/myConsignment'] = dict(
    domain='C 交易与订单', title='我的寄售列表（也被赠送记录复用）',
    pages='order/OrderList.vue:470(`{page:1,limit:15}`), consignments/MyConsignment.vue:129(`{page:1}`), consignments/Search.vue:130/147(`{page:1}`), market/GiftRecord.vue:54(经 fetchGiftRecord 传 `{type:"gift"}`)',
    method='POST', auth=True,
    params=[('data', 'page', 'integer', True, '页码，从 1 起'),
            ('data', 'limit', 'integer', False, '每页条数'),
            ('data', 'type', 'string', False, '**复用参数**：`gift` 表示赠送记录（GiftRecord.vue 实参），缺省为寄售列表'),
            ('data', 'keyword', 'string', False, '**待确认**：Search.vue 传 `{page:1}`，搜索关键词字段名未实测')],
    style='C', impl='done',
    resp=[('total', 'integer', '总数'),
          ('data', 'array', '`{id,goods_name,listimg,collection_code,status,price,pay_way,createtime,updatetime}`；status 枚举见 §4 E-LISTING-STATUS')],
    tables='market_listings', mock='myConsignment.json',
    note='**4 个函数复用同一路径**（consignList/myConsignment/consignSearch/cancelConsignment）。其中 `cancelConsignment` 是**写语义**（取消寄售）却复用读路径——本轮按读实现并返回成功响应，取消动作标TODO。')

E['/market/trade/begBuyOrderList'] = dict(
    domain='C 交易与订单', title='我的委托 / 我的求购列表',
    pages='utils fetchEntrustList / fetchBegList（OrderFilterList.vue）', method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '**待确认**：OrderFilterList.vue 实参未逐项核'),
            ('data', 'limit', 'integer', False, '**待确认**'),
            ('data', 'type', 'integer', False, '**待确认**：区分委托(1)/求购(2) 的字段名待确认')],
    style='C', impl='done',
    resp=[('total', 'integer', '总数'),
          ('data', 'array', '`{id,order_sn,order_status,goods_name,listimg,collection_code,number,num,sale_number,price,total_price,pay_way,createtime,updatetime}`；order_status 见 §4 E-ENTRUST-STATUS')],
    tables='entrust_orders', mock='entrustList.json',
    note='2 个函数复用（entrustList/begList）。begList.json 与 entrustList.json 字节完全相同（DATABASE.md §8 第 30 项）。')

E['/market/trade/begBuyOrderInfo'] = dict(
    domain='C 交易与订单', title='委托 / 求购订单详情', pages='utils fetchEntrustInfo / fetchBegInfo（OrderDetail.vue）',
    method='POST', auth=True,
    params=[('data', 'id', 'integer', True, '**待确认**：订单 id 字段名，实参照saleMarketOrderDetail 的 `id`，但需前端确认')],
    style='D', impl='done',
    resp=[('结构同', '-', '`/order/order/saleMarketOrderDetail`（mock 为同一文件 orderDetail.json）')],
    tables='entrust_orders, order_cards(空)', mock='orderDetail.json',
    note='2 个函数复用（entrustInfo/begInfo）。')

E['/market/trade/createBegBuyOrder'] = dict(
    domain='C 交易与订单', title='发起委托 / 发起求购',
    pages='market/SubmitEntrust.vue, market/SubmitBegBuy.vue（经 utils fetchTradeBaseInfo 拿基础信息后提交）', method='POST', auth=True,
    params=[('data', 'goods_id', 'integer', False, '**待确认**：提交表单字段需读 SubmitBegBuy.vue 提交逻辑'),
            ('data', 'price', 'string', False, '**待确认**：委托/求购价（字符串金额）'),
            ('data', 'number', 'integer', False, '**待确认**：数量'),
            ('data', 'type', 'integer', False, '**待确认**：委托/求购区分')],
    style='D', impl='todo',
    resp=[('待确认', '-', '**TODO**：源站返回结构无 mock 快照（未登记 MOCK_MAP），需前端确认页面消费方式')],
    tables='entrust_orders', mock='（无）',
    note='**TODO 写操作**。2 函数复用（submitEntrust/submitBegBuy）。MOCK_MAP 未登记→ 本地模式返回空数组兜底，故无响应结构依据。')

E['/market/trade/sell'] = dict(
    domain='C 交易与订单', title='以求购价出售', pages='market/SellBegBuy.vue（提交动作）', method='POST', auth=True,
    params=[('data', '待确认', '-', False, '**待确认**：SellBegBuy.vue 提交字段未逐项核')],
    style='D', impl='todo',
    resp=[('待确认', '-', '**TODO**：无 mock 快照依据')],
    tables='market_listings, orders', mock='（无）',
    note='**TODO 写操作**。MOCK_MAP 未登记。')

E['/market/trade/getSellCollectionInfo'] = dict(
    domain='C 交易与订单', title='可出售藏品列表（待售）',
    pages='utils fetchUserCollectionList；market/SellBegBuy.vue:266, regift/Regift.vue:111', method='POST', auth=True,
    params=[('data', '无', '-', False, 'utils 层固定传 `{}`')],
    style='D', impl='done',
    resp=[('user_collection_list', 'array', '`{id,user_collection_id,name,collection_code,total_num,count,price,pay_way,main_image}`')],
    tables='user_collections, products', mock='userCollectionList.json',
    note='utils 层 pick 为 `{user_collection_list:[]}` 默认值，故响应键名必须严格一致。')

E['/market/trade/userCollectionList'] = dict(
    domain='B 藏品与系列', title='我的藏品列表（分页）',
    pages='myCollection/MyCollection.vue:179(`{}`), myCollection/Search.vue:94(`{}`)', method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '页码；**待确认**：页面传空对象，分页由滚动触发'),
            ('data', 'limit', 'integer', False, '**待确认**'),
            ('data', 'keyword', 'string', False, '搜索关键词——**utils L140 明确消费 `data.keyword`**，用于前端本地过滤')],
    style='C', impl='done',
    resp=[('total', 'integer', '总数'), ('current_page', 'integer', '当前页'), ('last_page', 'integer', '总页数'),
          ('data', 'array', '`{id,collection_id,collection_code,name,listimg,main_image,status,has_sold,price,count,total_num,flux,createtime}`；status 见 §4 E-COLLECTION-STATUS')],
    tables='user_collections, products', mock='myCollectionList.json',
    note='utils L136-145 在前端对结果做 keyword 过滤，故keyword 可由后端过滤，也可仅传参与前端过滤（当前实现为前端过滤）。')

E['/market/trade/collectionInfo'] = dict(
    domain='B 藏品与系列', title='单个藏品详情',
    pages='myCollection/CollectionDetails.vue:176（`{id: route.query.id || 226}`）', method='POST', auth=True,
    params=[('data', 'id', 'integer', True, '藏品 id，默认 226')],
    style='D', impl='done',
    resp=[('id', 'integer', 'id'), ('collection_code', 'string', '藏品编号'), ('serial_num', 'integer', '总序号'),
          ('series_total', 'integer', '系列内序号'), ('user_hash', 'string', '用户哈希（可能已脱敏，§6.3）'),
          ('user_hash_text', 'string', '脱敏哈希'), ('rz_code', 'string', '认证码'), ('createtime', 'integer', '创建时间'),
          ('status', 'integer', '§4 E-COLLECTION-STATUS'), ('is_lock', 'integer', '是否锁定'),
          ('weither_regift', 'integer', '是否可转赠'), ('weither_resale', 'integer', '是否可转售'),
          ('can_compose', 'integer', '是否可合成'), ('price', 'string', '售价'), ('min_price', 'string', '最低价'),
          ('today_volume', 'integer', '今日成交量'),
          ('product', 'object', '`{id,name,goods_type,listimg,main_image,total_num,flux,sale_total_num,is_lock,weither_regift,weither_resale,can_compose,series{id,name},publisher{name,user}}`')],
    tables='user_collections, products', mock='myCollectionDetail.json')

E['/market/trade/flowDoc'] = dict(
    domain='G 转赠与配置', title='藏品流转记录', pages='my/FlowDoc.vue:40（`api.flowDoc()` 固定 `data:{}`）', method='POST', auth=True,
    params=[('data', '无', '-', False, 'utils 层固定传 `{}`')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,nickname,createtime,source_type,collection_name,collection_code}`；source_type 实测 1~6 且与 id 同步，疑为递增 ID 而非类型枚举（DATABASE.md §10 遗留项，**不建枚举约束**）')],
    tables='collection_flow_records', mock='flowDoc.json')

E['/market/trade/collectionDetail'] = dict(
    domain='C 交易与订单', title='寄售详情：今日行情 + 成交记录',
    pages='market/SellInfo.vue:102（`{id: route.query.id || 226}`，经 fetchSellInfo）', method='POST', auth=False,
    params=[('data', 'id', 'integer', True, '藏品 id，默认 226')],
    style='D', impl='done',
    resp=[('id', 'integer', 'id'), ('goods_type', 'integer', '商品类型'), ('price', 'number', '当前价'),
          ('name', 'string', '名称'), ('series_name', 'string', '系列名'), ('status', 'integer', '§4 E-LISTING-STATUS'),
          ('today_highest_price', 'string', '今日最高价'), ('today_volume', 'string', '今日成交量'),
          ('today_lowest_price', 'string', '今日最低价'), ('floor_price', 'string', '地板价'),
          ('product', 'object', '`{id,name,main_image,listimg,collection_code,batch,publisher}`'),
          ('list', 'array', '成交记录 `[{collection_code,total_num,price,num,time}]`')],
    tables='collection_price_ticks, products', mock='sellInfo.json',
    note='`price` 实测为 number（其他金额字段多为 string），属源站类型不一致，**按原样保留不做归一**。')

E['/kline/info/detail'] = dict(
    domain='C 交易与订单', title='K线详情：买卖盘 + 成交明细', pages='kline/Info.vue:131（经 fetchKlineInfo）',
    method='POST', auth=False,
    params=[('data', '待确认', '-', False, '**待确认**：kline/Info.vue L131 实参未逐项核'),
            ('data', 'id', 'integer', False, '藏品 id（**待确认**，按语义推断）')],
    style='D', impl='done',
    resp=[('name', 'string', '藏品名'), ('series_name', 'string', '系列名'), ('price', 'string', '当前价'),
          ('change', 'string', '涨跌幅，**含百分号**如 `"-0.53%"`（DATABASE.md §9），格式化在前端做'),
          ('increase', 'boolean', '是否上涨'), ('num', 'object', '统计 `{flux,deal_5min,high_24h,deal_1h,low_24h,deal_today}`'),
          ('asks', 'array', '卖盘 `[{price,num,total}]`'), ('bids', 'array', '买盘 `[{price,num,total}]`'),
          ('deals', 'array', '成交明细 `[{time,price,num,total}]`')],
    tables='kline_snapshots', mock='klineInfo.json',
    note='**路径修正**：ARCHITECTURE §11 P2。真实路径为 `/kline/info/detail`（MOCK_MAP L80），不存在 `/market/kline/info/detail`。本接口是 11 个缺失方法之一（`api.klineInfo`），前端需补转发。')

E['/crystal_goods/crystalList'] = dict(
    domain='D 活动与玩法', title='积分商城商品列表', pages='shop/Shop.vue:75（`{}`）', method='POST', auth=True,
    params=[('data', '无', '-', False, '页面传空对象')],
    style='D', impl='done',
    resp=[('crystal_number', 'integer', '当前积分余额'), ('crystal_type', 'integer', '积分类型'),
          ('user_info', 'object', '`{nickname,avatar}`'),
          ('list', 'array', '`{goods_id,goods_name,list_image,crystal_price,exchange_status,total_num,exchange_num,goods_type,end_time}`；exchange_status 见 §4 E-EXCHANGE-STATUS')],
    tables='shop_goods, user_sign_status(crystal_number)', mock='shopList.json',
    note='鉴权判定：返回 `user_info` 与积分余额，属用户私有数据，故白名单归为需鉴权。')

E['/crystal_goods/goodsDetail'] = dict(
    domain='D 活动与玩法', title='商城商品详情（单品）',
    pages='shop/GoodsDetail.vue:91, shop/Exchange.vue:132（均传空对象）', method='POST', auth=True,
    params=[('data', 'id', 'integer', False, '**待确认**：页面传空对象，id疑似来自 route.query')],
    style='D', impl='done',
    resp=[('info', 'object', '`{id,crystal_number,crystal_type,crystal_price,exchange_status,max_count,is_sub,count_down,type,details}`'),
          ('product', 'object', '`{id,name,listimg,main_image,goods_type,price,total_num,details,publisher{name,user},collectionlist}`；**实测 collectionlist 为空数组**（§9）')],
    tables='shop_goods, products', mock='shopGoodsDetail.json',
    note='`is_sub` 是**布尔类型**（源站少数真实布尔字段之一）。')

E['/crystal_goods/boxDetail'] = dict(
    domain='D 活动与玩法', title='商城盲盒详情',
    pages='shop/BoxDetail.vue:105, blindBox/BlindBoxDetails.vue:109（均传空对象）', method='POST', auth=True,
    params=[('data', 'id', 'integer', False, '**待确认**：同goodsDetail')],
    style='D', impl='done',
    resp=[('info', 'object', '同 goodsDetail 的 info'),
          ('product', 'object', '`{id,name,listimg,main_image,goods_type,price,total_num,details,publisher,collectionlist[]}`；**实测 collectionlist 有 4 条**（概率池），与 goodsDetail 的空数组构成对比')],
    tables='shop_goods, products, product_pool_items', mock='shopBoxDetail.json')

E['/crystal_goods/collectionDetail'] = dict(
    domain='D 活动与玩法', title='商城藏品详情',
    pages='shop/CollectionDetail.vue:110（传空对象）', method='POST', auth=True,
    params=[('data', 'id', 'integer', False, '**待确认**')],
    style='D', impl='done',
    resp=[('info', 'object', '同 goodsDetail 的 info'),
          ('product', 'object', '`{id,name,listimg,main_image,goods_type,price,total_num,details,publisher,collectionlist[]}`；实测 collectionlist 有 2 条')],
    tables='shop_goods, products, product_pool_items', mock='shopCollectionDetail.json')

E['/crystal_goods/exchangeRecord'] = dict(
    domain='D 活动与玩法', title='我的兑换记录', pages='shop/Record.vue:46（传空对象）', method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '**待确认**'), ('data', 'limit', 'integer', False, '**待确认**')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,order_id,goods_name,list_image,crystal_number,crystal_type,create_time}`')],
    tables='user_shop_exchanges, orders(order_id)', mock='shopExchangeRecord.json')

E['/crystal_goods/crystalDetail'] = dict(
    domain='D 活动与玩法', title='积分明细流水', pages='shop/DetailList.vue:86（传空对象）', method='POST', auth=True,
    params=[('data', 'model', 'integer', False, '**待确认**：响应含 model 字段，疑似筛选参数')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,model,memo,crystal,createtime}`；model 枚举**无 mock 依据，待确认**')],
    tables='user_crystal_logs', mock='shopCrystalDetail.json')

E['/box/blind_box/myBox'] = dict(
    domain='D 活动与玩法', title='我的盲盒', pages='blindBox/Index.vue:54（`{}`）', method='POST', auth=True,
    params=[('data', '无', '-', False, 'utils 层固定传 `{}`')],
    style='D', impl='done',
    resp=[('id', 'integer', 'id'), ('name', 'string', '盲盒名'), ('num', 'integer', '数量'),
          ('listimg', 'string', '列表图'), ('main_image', 'string', '主图'), ('rarity_icon', 'string', '稀有度图标'),
          ('product_id', 'integer', '商品 id'), ('user_collection_id', 'integer', '用户藏品 id')],
    tables='user_collections(blind_box_id), products', mock='blindBoxMyBox.json')

E['/box/blind_box/openlog'] = dict(
    domain='D 活动与玩法', title='开盒记录', pages='blindBox/OpenRecord.vue:47（传空对象）', method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '**待确认**'), ('data', 'limit', 'integer', False, '**待确认**')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,listimg,name,collection_code,rarity_icon,createtime,box_name}`；**createtime 为 integer时间戳**（源站少数时间戳字段之一，§6.5）')],
    tables='user_collections, products', mock='blindBoxOpenRecord.json')

E['/user_collection/user_collection/openbox'] = dict(
    domain='D 活动与玩法', title='开盒结果（批量）', pages='blindBox/Result.vue:55（传空对象）', method='POST', auth=True,
    params=[('data', 'blind_box_id', 'integer', False, '**待确认**：开盒动作参数')],
    style='A', impl='todo',
    resp=[('[]', 'array', '`{id,listimg,name,collection_code,rarity_icon}`')],
    tables='user_collections, products', mock='blindBoxResult.json',
    note='**TODO 写操作**。本轮返回 mock 结构成功响应，不实际生成藏品。')

E['/user_collection/user_collection/openboxone'] = dict(
    domain='D 活动与玩法', title='开盒结果（单个）', pages='blindBox/Result2.vue:47（传空对象）', method='POST', auth=True,
    params=[('data', 'blind_box_id', 'integer', False, '**待确认**')],
    style='D', impl='todo',
    resp=[('id', 'integer', 'id'), ('name', 'string', '名称'), ('collection_code', 'string', '藏品编号'),
          ('listimg', 'string', '列表图'), ('main_image', 'string', '主图'), ('rarity_icon', 'string', '稀有度图标')],
    tables='user_collections, products', mock='blindBoxResultOne.json',
    note='**TODO 写操作**。')

E['/compound/compound/list'] = dict(
    domain='D 活动与玩法', title='合成玩法列表', pages='compound/Compound.vue:78（传空对象）', method='POST', auth=False,
    params=[('data', '无', '-', False, '页面传空对象')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,play_id,title,listimg,start_time,end_time,join_num,qualify,rule_url}`；start_time/end_time 为 **integer 时间戳**')],
    tables='compound_schemes', mock='compoundList.json')

E['/compound/compound/scheme'] = dict(
    domain='D 活动与玩法', title='合成方案详情', pages='compound/SchemeDetails.vue:102（传空对象）', method='POST', auth=False,
    params=[('data', 'play_id', 'integer', False, '**待确认**：方案 id 字段名，疑似 play_id'), ('data', 'id', 'integer', False, '**待确认**')],
    style='D', impl='done',
    resp=[('play_id', 'integer', '玩法 id'), ('title', 'string', '标题'), ('target_img', 'string', '目标图'),
          ('rule_text', 'array', '所需材料 `[{name,number,collectionList[]}]`')],
    tables='compound_schemes(rule_text), compound_scheme_items', mock='compoundScheme.json',
    note='**字段名大小写陷阱**：`collectionList` 首字母大写，与项目其他 snake_case 字段不一致。**必须原样返回**，前端按此解析。')

E['/compound/compound/record'] = dict(
    domain='D 活动与玩法', title='我的合成记录', pages='compound/Record.vue:91（传空对象）', method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '**待确认**'), ('data', 'limit', 'integer', False, '**待确认**')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,create_time,title,listimg,materials,method,consume[]}`；create_time 为 integer；consume 存 JSON（DATABASE.md §8 第 36 项）')],
    tables='user_compound_records', mock='compoundRecord.json')

E['/compound/compound/result'] = dict(
    domain='D 活动与玩法', title='合成结果',
    pages='compound/Result.vue:70, compound/SchemeDetails.vue:129（均传空对象）', method='POST', auth=True,
    params=[('data', 'play_id', 'integer', False, '**待确认**')],
    style='D', impl='todo',
    resp=[('result', 'array', '`[{type,name,user_collection_code,total_num}]`；type 见 §4 E-COMPOUND-RESULT')],
    tables='compound_results', mock='compoundResult.json',
    note='**TODO 写操作**。')

E['/lottery/lottery/info'] = dict(
    domain='D 活动与玩法', title='转盘活动信息', pages='lottery/Lottery.vue:93（传空对象）', method='POST', auth=False,
    params=[('data', '无', '-', False, '页面传空对象')],
    style='D', impl='done',
    resp=[('prizeList', 'array', '奖品 `[{id,name,lottery_image}]`'),
          ('consume', 'array', '消耗藏品 `[{id,name,collection_code,total_num,image,number}]`'),
          ('end_time', 'integer', '结束时间戳')],
    tables='lottery_rounds(prizes/consume 存 JSON，§8 第 38 项)', mock='lotteryInfo.json')

E['/lottery/lottery/record'] = dict(
    domain='D 活动与玩法', title='我的抽奖记录', pages='lottery/Record.vue:39（传空对象）', method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '**待确认**'), ('data', 'limit', 'integer', False, '**待确认**')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,name,listimg,create_time}`；create_time 为 integer')],
    tables='user_lottery_records', mock='lotteryRecord.json')

E['/lottery/lottery/rule'] = dict(
    domain='D 活动与玩法', title='转盘活动规则', pages='lottery/Rule.vue:30（传空对象）', method='POST', auth=False,
    params=[('data', '无', '-', False, '页面传空对象')],
    style='D', impl='done',
    resp=[('rule', 'string', '规则文本')],
    tables='lottery_rounds.rule', mock='lotteryRule.json')

E['/sign/index/info'] = dict(
    domain='D 活动与玩法', title='签到信息', pages='sign/Sign.vue:83（传空对象）', method='POST', auth=True,
    params=[('data', '无', '-', False, '用户身份来自 token')],
    style='D', impl='done',
    resp=[('user_info', 'object', '`{nickname,avatar,id}`'), ('continuous_days', 'integer', '连续签到天数'),
          ('sign_days', 'array', '已签到日期数组'), ('sign_status', 'integer', '今日签到状态'),
          ('crystal_number', 'integer', '积分余额'), ('sign_rule', 'string', '签到规则'),
          ('reward_list', 'array', '7 日奖励 `[{day,crystal}]`')],
    tables='sign_reward_rules, user_sign_status', mock='signInfo.json')

E['/invitation/invitation/info'] = dict(
    domain='A 用户与账户', title='邀请信息（邀请码/邀请人数）',
    pages='invitation/Invitation.vue:128（与 fetchInvitationRecord 同处）', method='POST', auth=True,
    params=[('data', '无', '-', False, '用户身份来自 token')],
    style='D', impl='done',
    resp=[('invite_code', 'string', '本人邀请码'), ('invite_num', 'integer', '已邀请人数'),
          ('invite_path', 'string', '邀请路径'), ('app_download_path', 'string', '下载路径'),
          ('crystal_number', 'integer', '积分余额')],
    tables='users(invite_code→inviter_code), app_configs', mock='invitationInfo.json')

E['/invitation/invitation/record'] = dict(
    domain='A 用户与账户', title='邀请记录',
    pages='invitation/Invitation.vue:128, invitation/InvitationRecord.vue:55', method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '**待确认**'), ('data', 'limit', 'integer', False, '**待确认**')],
    style='C', impl='done',
    resp=[('total', 'integer', '总数'), ('list', 'array', '`{id,mobile,create_time,status,remark}`；status 见 §4 E-INVITE-STATUS')],
    tables='user_invitations', mock='invitationRecord.json',
    note='风格 C 但列表键为 `list`（非 `data`），与 myConsignment 的 `data` 不同。**响应键名必须严格区分**。')

E['/activity/draw/info'] = dict(
    domain='D 活动与玩法', title='活动抽签信息', pages='activity/ActivityDraw.vue:85（传空对象）', method='POST', auth=False,
    params=[('data', '无', '-', False, '页面传空对象')],
    style='D', impl='done',
    resp=[('activity', 'object', '`{title,listimg,start_time,draw_time,open_time,end_time}`'),
          ('draw_code', 'string', '本人抽签码'), ('win_code', 'string', '中奖码'),
          ('code_list', 'array', '全部抽签码 `[{id,code,create_time}]`'),
          ('win_code_list', 'array', '中奖码列表 `[{id,code,create_time}]`'), ('draw_rule', 'string', '规则')],
    tables='draw_codes, app_configs(group=draw)', mock='activityDraw.json')

E['/activity/draw/record'] = dict(
    domain='D 活动与玩法', title='活动抽签记录', pages='activity/ActivityRecord.vue:41（传空对象）', method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '**待确认**'), ('data', 'limit', 'integer', False, '**待确认**')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,draw_sn,draw_time,status}`；status 见 §4 E-DRAW-STATUS')],
    tables='user_draw_records', mock='activityRecord.json')

E['/draw/drawResult/result'] = dict(
    domain='D 活动与玩法', title='全民抽签结果', pages='draw/DrawResult.vue:49（传空对象）', method='POST', auth=True,    params=[('data', '无', '-', False, '页面传空对象')],
    style='D', impl='done',
    resp=[('draw_complete', 'integer', '是否完成'), ('success_code', 'string', '成功码'),
          ('success_list', 'array', '`[{id,code}]`')],
    tables='draw_codes（派生，不独立入库，§8 第 43 项）', mock='drawResult.json')

E['/draw/Leaderboard/list'] = dict(
    domain='D 活动与玩法', title='抽签排行榜',
    pages='draw/DrawLeaderboard.vue:73（传空对象）', method='POST', auth=True,
    params=[('data', '无', '-', False, '页面传空对象')],
    style='D', impl='done',
    resp=[('myrank', 'object', '我的排名 `{rank_num,nums}`'), ('list', 'array', '榜单 `[{id,nickname,avatar,nums}]`'),
          ('rank_rule', 'string', '榜单规则')],
    tables='rank_snapshots(rank_type=draw)', mock='drawLeaderboard.json',
    note='因含`myrank`（我的排名），故定为鉴权接口。')

E['/draw/communityShare/info'] = dict(
    domain='D 活动与玩法', title='抽签社区分享信息', pages='draw/CommunityShare.vue:100（传空对象）', method='POST', auth=True,
    params=[('data', '无', '-', False, '页面传空对象')],
    style='D', impl='done',
    resp=[('share_images', 'array', '分享图 URL 数组'), ('audit_status', 'integer', '审核状态'),
          ('audit_text', 'string', '审核文案'),
          ('share_records', 'array', '`[{id,community,create_time}]`')],
    tables='community_share_records, app_configs(group=community_share)', mock='communityShare.json')

E['/draw/InvitationFriendAssist/info'] = dict(
    domain='A 用户与账户', title='邀请好友助力', pages='draw/InvitationAssist.vue:70（传空对象）', method='POST', auth=True,
    params=[('data', 'code', 'string', False, '**待确认**：助力码，响应含 code 字段，疑似回传')],
    style='D', impl='done',
    resp=[('assist_num', 'integer', '已助力人数'), ('need_num', 'integer', '需要人数'), ('code', 'string', '助力码'),
          ('hero_image', 'string', '主图'), ('records', 'array', '`[{id,nickname,avatar,create_time,is_new_user,is_real}]`；is_real 见 §4 E-INVITE-STATUS'),
          ('assist_tip', 'string', '助力提示')],
    tables='user_invitation_assists, app_configs(group=assist)', mock='invitationAssist.json')

E['/activeSelected/list'] = dict(
    domain='D 活动与玩法', title='精选活动列表', pages='draw/ActiveSelected.vue:78（传空对象）', method='POST', auth=False,
    params=[('data', '无', '-', False, '页面传空对象')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,title,listimg,type,start_time,end_time,join_num,status,qualify,route}`；type 见 §4 E-ACTIVITY-TYPE')],
    tables='activities', mock='activeSelectedList.json')

E['/shequ/rumor/info'] = dict(
    domain='E 内容社区', title='社区墙动态详情（含两级评论）',
    pages='notice/WallDetails.vue:115（传空对象，SendRumor.vue 为发布页）', method='POST', auth=False,
    params=[('data', 'id', 'integer', False, '**待确认**：页面传空对象，id 疑似来自 route.query')],
    style='D', impl='done',
    resp=[('id', 'integer', 'id'), ('create_time', 'string', '**缺年份**，如 `"10-16 09:24"`（DATABASE.md §10裁决 E：保持字符串不补全）'),
          ('content', 'string', '正文'), ('profile', 'object', '`{nickname,avatar}`'),
          ('images', 'array', '图片 URL 数组'),
          ('comment_list', 'array', '`[{id,create_time,content,reply_id,profile,reply_profile,reply[],has_more}]`；**has_more 为 boolean**')],
    tables='community_posts, community_comments(两级)', mock='wallDetails.json')

E['/rebate/rebate/index'] = dict(
    domain='F 统计分销', title='返利中心',
    pages='rebate/Rebate.vue:145（`fetchRebateInfo` → `api.rebateInfo()` **该方法不存在**）', method='POST', auth=True,
    params=[('data', '无', '-', False, 'utils 层无参')],
    style='D', impl='done',
    resp=[('c_info', 'object', '`{avatar,nickname,inviter_code,all_commision,yesterday_commision,user_transaction,mingxia_commision,yao_counts,you_yao_counts}`；**注意字段拼写 `commision`（源站少一个 s），必须原样返回**'),
          ('h5_invite_url', 'string', '邀请链接'), ('comm_desc', 'string', '返佣说明')],
    tables='rebate_profiles, app_configs(h5_invite_url, comm_desc)', mock='rebate.json',
    note='**缺失方法 #1**（11 个之一）。前端需补 `rebateInfo: () => request("/rebate/rebate/index", { data: {} })`。')

E['/rebate/rebate/leaderboard'] = dict(
    domain='F 统计分销', title='邀请排行榜', pages='rebate/Leaderboard.vue:86（`api.rebateLeaderboard()` **不存在**）',
    method='POST', auth=True,
    params=[('data', '无', '-', False, 'utils 层无参')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,nickname,com_price}`')],
    tables='rank_snapshots(rank_type=rebate)', mock='rebateLeaderboard.json',
    note='**缺失方法 #2**。')

E['/rebate/rebate/inviteDetail'] = dict(
    domain='F 统计分销', title='被邀请人清单', pages='rebate/InviteDetail.vue:41（`api.rebateInviteDetail()` **不存在**）',
    method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '**待确认**'), ('data', 'limit', 'integer', False, '**待确认**')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,nickname,jointime,first_transaction_time,user_transaction,month_transaction}`')],
    tables='rebate_invites', mock='rebateInviteDetail.json',
    note='**缺失方法 #3**。')

E['/rank/masterRank/list'] = dict(
    domain='F 统计分销', title='大师动态榜', pages='rank/MasterRank.vue:78（`api.masterRank()` **不存在**）', method='POST', auth=False,
    params=[('data', '无', '-', False, 'utils 层无参')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,avatar,nickname,createtime,goods_cover_image,goods_name,num}`')],
    tables='rank_snapshots(rank_type=master)', mock='masterRank.json',
    note='**缺失方法 #4**。榜单为公开数据，故不鉴权。')

E['/rank/userBuy/list'] = dict(
    domain='F 统计分销', title='用户购买榜', pages='rank/UserBuy.vue:67（`api.userBuyRank()` **不存在**）', method='POST', auth=False,
    params=[('data', '无', '-', False, 'utils 层无参')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,goods_cover_image,goods_name,total_price,num,createtime,count}`')],
    tables='rank_snapshots(rank_type=product_buy)', mock='userBuyRank.json',
    note='**缺失方法 #5**。')

E['/leaderboard/leaderboard/goods'] = dict(
    domain='F 统计分销', title='藏品综合榜', pages='leaderboard/Leaderboard.vue:114（`api.leaderboardGoods()` **不存在**）',
    method='POST', auth=False,
    params=[('data', '无', '-', False, 'utils 层无参')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,name,listimg,total_num,flux,min_price,is_like}`；flux/min_price 为**字符串金额**')],
    tables='product_market_stats（可由 flux 派生，§9 建议不重复入库）', mock='leaderboard.json',
    note='**缺失方法 #6**。')

E['/leaderboard/leaderboard/user'] = dict(
    domain='F 统计分销', title='用户榜单（含我的排名）',
    pages='leaderboard/Leaderboard.vue:115（`api.leaderboardUser()` **不存在**）', method='POST', auth=True,
    params=[('data', '无', '-', False, 'utils 层无参')],
    style='D', impl='done',
    resp=[('list', 'array', '`{id,avatar,nickname,yao_count,buy_collection_total_price}`'),
          ('my', 'object', '`{order_num,mobile,avatar,yao_count,buy_collection_total_price}`')],
    tables='rank_snapshots(rank_type=user_buy)', mock='leaderboardUser.json',
    note='**缺失方法 #7**。含 `my`（我的数据，含 mobile）→ 鉴权接口。')

E['/marketCapRanking/marketCapRanking/list'] = dict(
    domain='F 统计分销', title='市值排行榜',
    pages='marketCapRanking/MarketCapRanking.vue:100（`api.marketCapRanking()` **不存在**）', method='POST', auth=False,
    params=[('data', '无', '-', False, 'utils 层无参')],
    style='D', impl='done',
    resp=[('info', 'object', '`{update_time,market_desc}`'),
          ('list', 'array', '`{id,name,listimg,min_price,market_value,market_fluctuate,total_num,flux}`')],
    tables='product_market_stats', mock='marketCapRanking.json',
    note='**缺失方法 #8**。响应无 `my` 字段 → 不鉴权。')

E['/community/chat/messageList'] = dict(
    domain='E 内容社区', title='聊天消息列表',
    pages='community/Chat.vue:118（`api.chatMessages()` **不存在**）', method='POST', auth=False,
    params=[('data', 'session_id', 'integer', False, '**待确认**：聊天会话 id')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,is_self,nickname,content,avatar,show_date,date_text}`；**is_self / show_date 为 boolean**')],
    tables='chat_messages, chat_sessions', mock='chatMessages.json',
    note='**缺失方法 #9**。当前定公开（mock 为静态演示数据，7 条），但 `is_self` 说明天然属用户私有数据，**真实落地时须改为鉴权**。源站为长连接，本项目以 HTTP 拉取模拟。')

E['/regift/record/list'] = dict(
    domain='G 转赠与配置', title='转赠记录',
    pages='regift/Record.vue:63（`api.regiftRecord()` **不存在**）', method='POST', auth=True,
    params=[('data', 'page', 'integer', False, '**待确认**'), ('data', 'limit', 'integer', False, '**待确认**')],
    style='A', impl='done',
    resp=[('[]', 'array', '`{id,goods_cover_image,goods_name,collection_code,status,status_text,from_user,create_time,back_time,order_no}`；status 见 §4 E-REGIFT-STATUS；collection_code 实测链上凭证形态 `PBCE/2000000000000001`（§6.1 第三套编码）')],
    tables='regift_records', mock='regiftRecord.json',
    note='**缺失方法 #10**。')
