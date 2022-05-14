import React,{useState} from 'react';
import {Modal, Form, Input, Button, Dragger, Upload,message} from "antd";
import {connect, WalletConnection} from "near-api-js";
import {getConfig} from "../../config";
import {signRule,createSeries} from "../../api/api";
import {contract, parseAmount, sign} from "../../utils/util";

const config = getConfig()

const { Item } = Form;
function AddSeries(props) {
    const [form] = Form.useForm();
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [cover, setCover] = useState('');
    const [attributeList,setAttributeList] = useState([{type:'',value:''}])
    // const [isParas, setParas] = useState(false)

    const onFinish = async (values) => {
        // const _near = await connect(config);
        // const _wallet = new WalletConnection(_near,1);
        // const account = await _wallet.account();
        // const rule= await account.viewFunction(config.RULE_CONTRACT,'get_guild', {guild_id:values.guild_id});
        // console.log(rule);
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
    const onCheck = async () => {
        try {
            const values = await form.validateFields();
            // let args = {
            //     guild_id: values.guild_id,
            //     role_id: values.role_id,
            // }
            setConfirmLoading(true);
            const near = await connect(config);
            const wallet = new WalletConnection(near,"nepbot");
            const account = wallet.account() 

            //authorization

            //formData
            const params = {
                // files:[values.logo,values.cover],
                collection: values.name, //??????????????
                description:values.description,
                creator_id: account.accountId,
                collection_id:props.match.params.id,
                attributes:form.attributeList,
                mime_type:'',
                blurhash:''
            }
            const formData = new FormData();
            formData.append('files',values.cover)
            formData.append('files',params)

            //paras - collection
            const res = await createSeries(formData);
            // console.log(res,'paras-res');
            
            
            // const msg = {
            //     args: {
            //         sign:localStorage.getItem("nepbot_wallet_auth_key").allKeys
            //     },
            //     sign: await sign(account, [args]),
            //     account_id: account.accountId
            // }
            // const _sign = await signRule(msg);
            // const data = await account.functionCall(
            //     config.NFT_CONTRACT,
            //     'add_token_metadata',
            //      {args:JSON.stringify([args]),sign:_sign.sign},
            //     '300000000000000',
            //     '20000000000000000000000',
            // );
            // setTimeout(()=>{
            //     if(data){
            //         setConfirmLoading(false);
            //         form.resetFields();
            //         props.onOk();
            //     }
            // })
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
        }
    };

    

    function beforeUpload(file) {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
          message.error('You can only upload JPG/PNG file!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
          message.error('Image must smaller than 2MB!');
        }
        return isJpgOrPng && isLt2M;
    }

    function getBase64(img, callback) {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result));
        reader.readAsDataURL(img);
    }

    function uploadCover(info){
        console.log(info,'info');
        getBase64(info.file, imageUrl =>
            setCover(imageUrl)
        );
    }
    const normFile = (e) => {
        console.log('Upload event:', e);
        if (Array.isArray(e)) {
          return e;
        }
        return e && e.fileList;
    };

    function UploadCoverContent(){
        if(cover){
            return <img src={cover} alt="cover" style={{ width: '100%' }} />
        }else{
            return <div>
                click to upload cover
            </div>
        }
    }
    function Attribute(){
        const setAttributeItems = attributeList.map((item,index) => {
            return <div key={index} className={'attribute-item'}>
				<div className={'attribute-type'}>
					<Form.Item name={['attributeList',index,'type']} noStyle>
                        <Input placeholder="Account ID" onChange={(event)=>onChange(index,'type',event)}/>
                    </Form.Item>
				</div>
				<div className={'attribute-value'}>
					<Form.Item name={['attributeList',index,'value']} noStyle>
                        <Input placeholder="0" onChange={(event)=>onChange(index,'value',event)}/>
                    </Form.Item>
				</div>
				<div className={'attribute-del'} type="primary" onClick={()=>del(index)}>delete</div>
			</div>
        })
        return (<div className={'attribute-list'}>
            {setAttributeItems}
        </div>)
    }
    const onChange = (index,name,event)=>{
		let tempArray = [...attributeList];
		if('type'===name)
			tempArray[index] = {...tempArray[index],type:event.target.value}
		else
			tempArray[index] = {...tempArray[index],value:event.target.value}
		return setAttributeList(tempArray)
	}
    const add = ()=>{
		form.setFieldsValue({"attributeList":[...attributeList,{type:'',value:''}]})
		// return 
        setAttributeList([...attributeList,{type:'',value:''}])
        console.log(attributeList);
	}
    const del = (index)=>{
		form.setFieldsValue({"attributeList":[...attributeList.slice(0,index),...attributeList.slice(index+1)]})
		return setAttributeList([...attributeList.slice(0,index),...attributeList.slice(index+1)])
	}


    return (
        <div className={'modal-box'}>
            <Modal title="Add Series" wrapClassName="series-modal"   visible={props.visible} onOk={props.onOk}
                footer={[
                    <Button key="back" onClick={()=>{ form.resetFields();props.onCancel(); }}>
                        cancel
                    </Button>,
                    <Button loading={confirmLoading}  key="submit" htmlType="submit" type="primary" onClick={onCheck}>
                        ok
                    </Button>
                ]} 
                onCancel={props.onCancel}
                >
                <Form
                    form={form}
                    name="basic"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 14 }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    initialValues={{attributeList:attributeList,}}
                >
                    <Item
                        label="Cover"
                        name="cover"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                        rules={[{ required: true, message: 'upload cover' }]}
                    >
                        <Upload
                            name="cover"
                            listType="picture-card"
                            className="cover-uploader"
                            showUploadList={false}
                            // action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                            beforeUpload={beforeUpload}
                            // onChange={handleChange}
                            customRequest={uploadCover}
                        >
                            <UploadCoverContent/>
                        </Upload>
                    </Item>
                    <Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: 'Enter a name' }]}
                    >
                        <Input/>
                    </Item>
                    <Item
                        label="Description"
                        name="description"
                        rules={[{ required: true, message: 'Enter a description' }]}
                    >
                        <Input/>
                    </Item>
                    <Item
                        label="Number of copies"
                        name="copyNumber"
                        rules={[{ required: true, message: 'Enter Number' }]}
                    >
                        <Input/>
                    </Item>
                    <Item
                        label="Attribute"
                    >
                        <Attribute/>
                        <Button type="primary" onClick={add}>+</Button>
                    </Item>
                </Form>
            </Modal>
        </div>
    );
}




export default AddSeries;