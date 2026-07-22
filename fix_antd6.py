"""Fix antd 6 compatibility: TabPane -> items API, bodyStyle -> styles"""
import re

BASE = r'c:\Users\Annbertie\.trae-cn\work\6a5e14b87ee208e78ad84cd7\industry-academia-research\src'

# 1. Fix Dashboard.tsx: bodyStyle -> styles
path = f'{BASE}\\pages\\dashboard\\Dashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('bodyStyle={{ padding: 0 }}', 'styles={{ body: { padding: 0 } }}')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed Dashboard.tsx')

# 2. Fix ProjectDetail.tsx
path = f'{BASE}\\pages\\projects\\ProjectDetail.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove TabPane destructuring
content = content.replace('const { TabPane } = Tabs;\n', '')

# Replace the Tabs block with items API
old_tabs = """      <Card>
        <Tabs defaultActiveKey="contract">
          <TabPane tab="合同管理" key="contract">
            <ContractModule projectId={id} progress={progress} onRefresh={fetchData} />
          </TabPane>
          <TabPane tab="合同盖章" key="stamp">
            <StampModule projectId={id} progress={progress} onRefresh={fetchData} />
          </TabPane>
          <TabPane tab="合同寄出" key="shipment">
            <ShipmentModule projectId={id} progress={progress} onRefresh={fetchData} />
          </TabPane>
          <TabPane tab="打款开票" key="payment">
            <PaymentModule projectId={id} progress={progress} onRefresh={fetchData} />
          </TabPane>
          <TabPane tab="经费报销" key="expense">
            <ExpenseModule projectId={id} progress={progress} onRefresh={fetchData} />
          </TabPane>
          <TabPane tab="结题" key="closure">
            <ClosureModule projectId={id} progress={progress} onRefresh={fetchData} />
          </TabPane>
        </Tabs>
      </Card>"""

new_tabs = """      <Card>
        <Tabs
          defaultActiveKey="contract"
          items={[
            { key: 'contract', label: '合同管理', children: <ContractModule projectId={id} progress={progress} onRefresh={fetchData} /> },
            { key: 'stamp', label: '合同盖章', children: <StampModule projectId={id} progress={progress} onRefresh={fetchData} /> },
            { key: 'shipment', label: '合同寄出', children: <ShipmentModule projectId={id} progress={progress} onRefresh={fetchData} /> },
            { key: 'payment', label: '打款开票', children: <PaymentModule projectId={id} progress={progress} onRefresh={fetchData} /> },
            { key: 'expense', label: '经费报销', children: <ExpenseModule projectId={id} progress={progress} onRefresh={fetchData} /> },
            { key: 'closure', label: '结题', children: <ClosureModule projectId={id} progress={progress} onRefresh={fetchData} /> },
          ]}
        />
      </Card>"""

content = content.replace(old_tabs, new_tabs)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed ProjectDetail.tsx')

# 3. Fix AdminConfig.tsx
path = f'{BASE}\\pages\\admin\\AdminConfig.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const { TabPane } = Tabs;\n', '')

old_config_tabs = """      <Tabs defaultActiveKey="configs">
        <TabPane tab="配置项" key="configs">
          <Table
            rowKey="key"
            columns={configColumns}
            dataSource={configs}
            loading={loading}
          />
        </TabPane>
        <TabPane tab="操作日志" key="logs">
          <Table
            rowKey="id"
            columns={logColumns}
            dataSource={logs}
            loading={loading}
          />
        </TabPane>
      </Tabs>"""

new_config_tabs = """      <Tabs
        defaultActiveKey="configs"
        items={[
          {
            key: 'configs',
            label: '配置项',
            children: (
              <Table
                rowKey="key"
                columns={configColumns}
                dataSource={configs}
                loading={loading}
              />
            ),
          },
          {
            key: 'logs',
            label: '操作日志',
            children: (
              <Table
                rowKey="id"
                columns={logColumns}
                dataSource={logs}
                loading={loading}
              />
            ),
          },
        ]}
      />"""

content = content.replace(old_config_tabs, new_config_tabs)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed AdminConfig.tsx')

# 4. Fix AdminNotifications.tsx
path = f'{BASE}\\pages\\admin\\AdminNotifications.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const { TabPane } = Tabs;\n', '')

old_notif_tabs = """      <Tabs defaultActiveKey="feedbacks">
        <TabPane tab="问题反馈" key="feedbacks">
          <Table
            rowKey="id"
            columns={feedbackColumns}
            dataSource={feedbacks}
            loading={loading}
          />
        </TabPane>
        <TabPane
          tab="公告管理"
          key="announcements"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAnnounceModalOpen(true)}>
              发布公告
            </Button>
          }
        >
          <Table
            rowKey="id"
            columns={announcementColumns}
            dataSource={announcements}
            loading={loading}
          />
        </TabPane>
      </Tabs>"""

new_notif_tabs = """      <Tabs
        defaultActiveKey="feedbacks"
        items={[
          {
            key: 'feedbacks',
            label: '问题反馈',
            children: (
              <Table
                rowKey="id"
                columns={feedbackColumns}
                dataSource={feedbacks}
                loading={loading}
              />
            ),
          },
          {
            key: 'announcements',
            label: '公告管理',
            children: (
              <Table
                rowKey="id"
                columns={announcementColumns}
                dataSource={announcements}
                loading={loading}
              />
            ),
          },
        ]}
        tabBarExtraContent={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAnnounceModalOpen(true)}>
            发布公告
          </Button>
        }
      />"""

content = content.replace(old_notif_tabs, new_notif_tabs)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed AdminNotifications.tsx')

# 5. Fix ContractModule.tsx - most complex, with JSX labels and forms
path = f'{BASE}\\pages\\modules\\ContractModule.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const { TabPane } = Tabs;\n', '')

# Replace the entire Tabs section
old_contract = """  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span>合同审核{renderLocked(reviewSubmitted)}</span>} key="review">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              {reviewSubmitted && (
                <Button icon={<EditOutlined />} onClick={() => openModModal('review')}>
                  申请修改
                </Button>
              )}
            </Space>
            <Form form={reviewForm} onFinish={(v) => handleSave('review', v)} layout="vertical" disabled={reviewSubmitted}>
              <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
                <Input placeholder="请输入责任人" />
              </Form.Item>
              <Form.Item label="审核时间" name="review_time" rules={[{ required: true, message: '请选择审核时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="起草方" name="drafting_party" rules={[{ required: true, message: '请选择起草方' }]}>
                <Radio.Group>
                  <Radio value="我方起草">我方起草</Radio>
                  <Radio value="对方起草">对方起草</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="合同文件" name="contract_file">
                <FileInput disabled={reviewSubmitted} />
              </Form.Item>
              <Form.Item label="审核备注" name="review_remark">
                <Input.TextArea rows={3} placeholder="请输入审核备注" />
              </Form.Item>
              {!reviewSubmitted && (
                <Space>
                  <Button type="primary" onClick={() => reviewForm.submit()}>保存</Button>
                  <Button type="primary" danger onClick={() => handleSubmit('review')}>提交</Button>
                </Space>
              )}
            </Form>
          </Card>
        </TabPane>

        <TabPane tab={<span>合同确认{renderLocked(confirmationSubmitted)}</span>} key="confirmation">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              {confirmationSubmitted && (
                <Button icon={<EditOutlined />} onClick={() => openModModal('confirmation')}>
                  申请修改
                </Button>
              )}
            </Space>
            <Form form={confirmForm} onFinish={(v) => handleSave('confirmation', v)} layout="vertical" disabled={confirmationSubmitted}>
              <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
                <Input placeholder="请输入责任人" />
              </Form.Item>
              <Form.Item label="确认时间" name="confirmation_time" rules={[{ required: true, message: '请选择确认时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="最终合同" name="final_contract">
                <FileInput disabled={confirmationSubmitted} />
              </Form.Item>
              <Form.Item label="确认说明" name="confirmation_desc">
                <Input.TextArea rows={3} placeholder="请输入确认说明" />
              </Form.Item>
              {!confirmationSubmitted && (
                <Space>
                  <Button type="primary" onClick={() => confirmForm.submit()}>保存</Button>
                  <Button type="primary" danger onClick={() => handleSubmit('confirmation')}>提交</Button>
                </Space>
              )}
            </Form>
          </Card>
        </TabPane>

        <TabPane tab={<span>合同签收{renderLocked(receiptSubmitted)}</span>} key="receipt">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              {receiptSubmitted && (
                <Button icon={<EditOutlined />} onClick={() => openModModal('receipt')}>
                  申请修改
                </Button>
              )}
            </Space>
            <Form form={receiptForm} onFinish={(v) => handleSave('receipt', v)} layout="vertical" disabled={receiptSubmitted}>
              <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
                <Input placeholder="请输入责任人" />
              </Form.Item>
              <Form.Item label="签收时间" name="receipt_time" rules={[{ required: true, message: '请选择签收时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="快递单号" name="tracking_number" rules={[{ required: true, message: '请输入快递单号' }]}>
                <Input placeholder="请输入快递单号" />
              </Form.Item>
              <Form.Item label="签收截图" name="receipt_screenshot">
                <FileInput disabled={receiptSubmitted} />
              </Form.Item>
              {!receiptSubmitted && (
                <Space>
                  <Button type="primary" onClick={() => receiptForm.submit()}>保存</Button>
                  <Button type="primary" danger onClick={() => handleSubmit('receipt')}>提交</Button>
                </Space>
              )}
            </Form>
          </Card>
        </TabPane>
      </Tabs>"""

new_contract = """  const contractTabItems = [
    {
      key: 'review',
      label: <span>合同审核{renderLocked(reviewSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {reviewSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('review')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={reviewForm} onFinish={(v) => handleSave('review', v)} layout="vertical" disabled={reviewSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="审核时间" name="review_time" rules={[{ required: true, message: '请选择审核时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="起草方" name="drafting_party" rules={[{ required: true, message: '请选择起草方' }]}>
              <Radio.Group>
                <Radio value="我方起草">我方起草</Radio>
                <Radio value="对方起草">对方起草</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="合同文件" name="contract_file">
              <FileInput disabled={reviewSubmitted} />
            </Form.Item>
            <Form.Item label="审核备注" name="review_remark">
              <Input.TextArea rows={3} placeholder="请输入审核备注" />
            </Form.Item>
            {!reviewSubmitted && (
              <Space>
                <Button type="primary" onClick={() => reviewForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('review')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
    {
      key: 'confirmation',
      label: <span>合同确认{renderLocked(confirmationSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {confirmationSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('confirmation')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={confirmForm} onFinish={(v) => handleSave('confirmation', v)} layout="vertical" disabled={confirmationSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="确认时间" name="confirmation_time" rules={[{ required: true, message: '请选择确认时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="最终合同" name="final_contract">
              <FileInput disabled={confirmationSubmitted} />
            </Form.Item>
            <Form.Item label="确认说明" name="confirmation_desc">
              <Input.TextArea rows={3} placeholder="请输入确认说明" />
            </Form.Item>
            {!confirmationSubmitted && (
              <Space>
                <Button type="primary" onClick={() => confirmForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('confirmation')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
    {
      key: 'receipt',
      label: <span>合同签收{renderLocked(receiptSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {receiptSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('receipt')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={receiptForm} onFinish={(v) => handleSave('receipt', v)} layout="vertical" disabled={receiptSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="签收时间" name="receipt_time" rules={[{ required: true, message: '请选择签收时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="快递单号" name="tracking_number" rules={[{ required: true, message: '请输入快递单号' }]}>
              <Input placeholder="请输入快递单号" />
            </Form.Item>
            <Form.Item label="签收截图" name="receipt_screenshot">
              <FileInput disabled={receiptSubmitted} />
            </Form.Item>
            {!receiptSubmitted && (
              <Space>
                <Button type="primary" onClick={() => receiptForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('receipt')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={contractTabItems} />"""

content = content.replace(old_contract, new_contract)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed ContractModule.tsx')

# 6. Fix PaymentModule.tsx
path = f'{BASE}\\pages\\modules\\PaymentModule.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const { TabPane } = Tabs;\n', '')

old_payment = """  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span>客户打款{renderLocked(paymentSubmitted)}</span>} key="payment">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              {paymentSubmitted && (
                <Button icon={<EditOutlined />} onClick={() => openModModal('payment')}>
                  申请修改
                </Button>
              )}
            </Space>
            <Form form={paymentForm} onFinish={(v) => handleSave('payment', v)} layout="vertical" disabled={paymentSubmitted}>
              <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
                <Input placeholder="请输入责任人" />
              </Form.Item>
              <Form.Item label="到账金额" name="amount" rules={[{ required: true, message: '请输入到账金额' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入到账金额" />
              </Form.Item>
              <Form.Item label="到账时间" name="arrival_time" rules={[{ required: true, message: '请选择到账时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="银行回单" name="bank_proof">
                <FileInput disabled={paymentSubmitted} />
              </Form.Item>
              <Form.Item label="打款备注" name="payment_remark">
                <Input.TextArea rows={3} placeholder="请输入打款备注" />
              </Form.Item>
              {!paymentSubmitted && (
                <Space>
                  <Button type="primary" onClick={() => paymentForm.submit()}>保存</Button>
                  <Button type="primary" danger onClick={() => handleSubmit('payment')}>提交</Button>
                </Space>
              )}
            </Form>
          </Card>
        </TabPane>

        <TabPane tab={<span>经费认领{renderLocked(fundClaimSubmitted)}</span>} key="fundClaim">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              {fundClaimSubmitted && (
                <Button icon={<EditOutlined />} onClick={() => openModModal('fundClaim')}>
                  申请修改
                </Button>
              )}
            </Space>
            <Form form={claimForm} onFinish={(v) => handleSave('fundClaim', v)} layout="vertical" disabled={fundClaimSubmitted}>
              <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
                <Input placeholder="请输入责任人" />
              </Form.Item>
              <Form.Item label="认领时间" name="claim_time" rules={[{ required: true, message: '请选择认领时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="认领金额" name="claim_amount" rules={[{ required: true, message: '请输入认领金额' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="默认同步打款金额" />
              </Form.Item>
              <Form.Item label="认领说明" name="claim_desc">
                <Input.TextArea rows={3} placeholder="请输入认领说明" />
              </Form.Item>
              {!fundClaimSubmitted && (
                <Space>
                  <Button type="primary" onClick={() => claimForm.submit()}>保存</Button>
                  <Button type="primary" danger onClick={() => handleSubmit('fundClaim')}>提交</Button>
                </Space>
              )}
            </Form>
          </Card>
        </TabPane>

        <TabPane tab={<span>开票{renderLocked(invoiceSubmitted)}</span>} key="invoice">
          <Card>
            <Space style={{ marginBottom: 16 }}>
              {invoiceSubmitted && (
                <Button icon={<EditOutlined />} onClick={() => openModModal('invoice')}>
                  申请修改
                </Button>
              )}
            </Space>
            <Form form={invoiceForm} onFinish={(v) => handleSave('invoice', v)} layout="vertical" disabled={invoiceSubmitted}>
              <Form.Item label="发票类型" name="invoice_type" rules={[{ required: true, message: '请选择发票类型' }]}>
                <Select placeholder="请选择发票类型">
                  {INVOICE_TYPES.map((t) => (
                    <Select.Option key={t} value={t}>{t}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="预览发送时间" name="preview_send_time">
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="客户确认时间" name="customer_confirm_time">
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="正式开具时间" name="official_issue_time">
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="发票寄出时间" name="invoice_send_time">
                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              <Form.Item label="发票文件" name="invoice_file">
                <FileInput disabled={invoiceSubmitted} />
              </Form.Item>
              {!invoiceSubmitted && (
                <Space>
                  <Button type="primary" onClick={() => invoiceForm.submit()}>保存</Button>
                  <Button type="primary" danger onClick={() => handleSubmit('invoice')}>提交</Button>
                </Space>
              )}
            </Form>
          </Card>
        </TabPane>
      </Tabs>"""

new_payment = """  const paymentTabItems = [
    {
      key: 'payment',
      label: <span>客户打款{renderLocked(paymentSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {paymentSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('payment')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={paymentForm} onFinish={(v) => handleSave('payment', v)} layout="vertical" disabled={paymentSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="到账金额" name="amount" rules={[{ required: true, message: '请输入到账金额' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入到账金额" />
            </Form.Item>
            <Form.Item label="到账时间" name="arrival_time" rules={[{ required: true, message: '请选择到账时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="银行回单" name="bank_proof">
              <FileInput disabled={paymentSubmitted} />
            </Form.Item>
            <Form.Item label="打款备注" name="payment_remark">
              <Input.TextArea rows={3} placeholder="请输入打款备注" />
            </Form.Item>
            {!paymentSubmitted && (
              <Space>
                <Button type="primary" onClick={() => paymentForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('payment')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
    {
      key: 'fundClaim',
      label: <span>经费认领{renderLocked(fundClaimSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {fundClaimSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('fundClaim')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={claimForm} onFinish={(v) => handleSave('fundClaim', v)} layout="vertical" disabled={fundClaimSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="认领时间" name="claim_time" rules={[{ required: true, message: '请选择认领时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="认领金额" name="claim_amount" rules={[{ required: true, message: '请输入认领金额' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="默认同步打款金额" />
            </Form.Item>
            <Form.Item label="认领说明" name="claim_desc">
              <Input.TextArea rows={3} placeholder="请输入认领说明" />
            </Form.Item>
            {!fundClaimSubmitted && (
              <Space>
                <Button type="primary" onClick={() => claimForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('fundClaim')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
    {
      key: 'invoice',
      label: <span>开票{renderLocked(invoiceSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {invoiceSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('invoice')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={invoiceForm} onFinish={(v) => handleSave('invoice', v)} layout="vertical" disabled={invoiceSubmitted}>
            <Form.Item label="发票类型" name="invoice_type" rules={[{ required: true, message: '请选择发票类型' }]}>
              <Select placeholder="请选择发票类型">
                {INVOICE_TYPES.map((t) => (
                  <Select.Option key={t} value={t}>{t}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="预览发送时间" name="preview_send_time">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="客户确认时间" name="customer_confirm_time">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="正式开具时间" name="official_issue_time">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="发票寄出时间" name="invoice_send_time">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="发票文件" name="invoice_file">
              <FileInput disabled={invoiceSubmitted} />
            </Form.Item>
            {!invoiceSubmitted && (
              <Space>
                <Button type="primary" onClick={() => invoiceForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('invoice')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={paymentTabItems} />"""

content = content.replace(old_payment, new_payment)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed PaymentModule.tsx')

print('\nAll fixes applied successfully!')