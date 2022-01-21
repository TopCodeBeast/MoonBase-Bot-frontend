import React,{useState} from 'react';
import {Modal, Form, Input, Button, Select} from "antd";
import {connect, WalletConnection} from "near-api-js";
import {config} from "../../config";
import {signRule} from "../../api/api";
import {contract, parseAmount, sign} from "../../utils/util";
const { Item } = Form;
const { Option } = Select;
function AddRule(props) {
    const [form] = Form.useForm();
    const [confirmLoading, setConfirmLoading] = useState(false);
    // const [checkNick, setCheckNick] = useState(false);
    const onFinish = async (values) => {
        console.log('Success:', values);

        const _near = await connect(config);
        const _wallet = new WalletConnection(_near,1);
        const account = await _wallet.account();
        const rule= await account.viewFunction(config.contract_id,'get_guild', {guild_id:values.guild_id});
        console.log(rule);
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
    const onCheck = async () => {
        try {
            const values = await form.validateFields();
            setConfirmLoading(true);
            const near = await connect(config);
            const wallet = new WalletConnection(near,"nepbot");
            const account = wallet.account()
            let metadata = await account.viewFunction(values.token_id, 'ft_metadata', {})
            values.amount += '.'
            for (let i = 0; i < metadata.decimals; i ++) {
                values.amount += '0'
            }
            values.amount = parseAmount(values.amount)
            const msg = {
                args: [values],
                sign: await sign(account, [values]),
                account_id: account.accountId
            }
            const _sign = await signRule(msg);
            
            const data = await account.functionCall(
                config.contract_id,
                'set_roles',
                 {args:JSON.stringify([values]),sign:_sign.sign},
                '300000000000000',
                '20000000000000000000000',
            );
            setTimeout(()=>{
                if(data){
                    setConfirmLoading(false);
                    form.resetFields();
                    props.onOk();
                }
            })
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
        }
    };
    const {serverList} = props;
    const roleList = props.roleList.map(item=><Option value={item.id} key={item.id}>{item.name}</Option>);
    const itemList = []
    itemList.push(
        <Item
            label="server name"
            name="guild_id"
            rules={[{ required: true, message: 'Please choose a server' }]}
        >
            <Select>
                <Option value={serverList.id}>{serverList.name}</Option>
            </Select>
        </Item>
    )
    itemList.push(
        <Item
            label="role"
            name="role_id"
            rules={[{ required: true, message: 'Please choose a role' }]}
        >
            <Select>
                <Option value={item.id} key={item.id}>{item.name}</Option>
            </Select>
        </Item>
    )

    itemList.push(
        <Item
            label="type"
            name="type"
            rules={[{ required: true, message: 'Please choose a type' }]}
        >
            <Select>
                {roleList}
            </Select>
        </Item>
    )
    
    
    <Item
        label="token_address"
        name="token_id"
        rules={[{ required: true, message: 'Enter a token address' }]}
    >
        <Input />
    </Item>
    <Item
        label="token_amount"
        name="amount"
        rules={[{ required: true, message: 'Enter a token amount' }]}
    >
        <Input />
    </Item> )

    return (
        <div>
            <Modal title="add rule"   visible={props.visible} onOk={props.onOk}
                   footer={[
                <Button key="back" onClick={()=>{ form.resetFields();props.onCancel(); }}>
                    cancel
                </Button>,
                <Button loading={confirmLoading}  key="submit" htmlType="submit" type="primary" onClick={onCheck}>
                    ok
                </Button>
            ]} onCancel={props.onCancel}>
                <Form
                    form={form}
                    name="basic"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    

                    {/*<Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item>*/}
                </Form>
            </Modal>
        </div>
    );
}

export default AddRule;
