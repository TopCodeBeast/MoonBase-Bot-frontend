import React, {useCallback, useEffect, useState} from 'react';
import {Button, Input, Table, Row, Col,Space} from "antd";
import {connect, WalletConnection} from "near-api-js";
import {getConfig} from "../../config";
import AddRule from "./addRule";
import {getRoleList, getServer, signRule, getOperationSign} from "../../api/api";
import './setRule.css'
import qs from "qs";
import store from "../../store/discordInfo";
import {formatAmount, sign} from "../../utils/util";
import test_icon from '../../assets/imgs/test_icon.png';
import no_data from '../../assets/imgs/no_data.jpg';

const config = getConfig()

function SetRule(props) {
    let account = {}
    const guildData = qs.parse(props.location.search.slice(1));
    store.set('guild_id',guildData.guild_id , {expires:1})
    const [roleList, setRoleList] = useState([]);
    const [addDialogStatus, setAddDialogStatus] = useState(false);
    const [server, setServer] = useState({});
    const [tokenId, setTokenId] = useState('')
    const [dataSource, setDataSource] = useState([]);
    const [appchainIds, setAppchainIds] = useState([])
    const [operationSign, setOperationSign] = useState("")
    const columns = [
        {
            dataIndex: 'guild_name',
            title: 'Discord Server',
            key: 'guild_name',
            render:(text, record)=> {
                return (
                    <span key={Math.random()}>{guildData.guild_name}</span>
                )
            }
            
        },
        {
            dataIndex: 'role_name',
            title: 'Role',
            key: 'role_name',
            render: (text,record) => {
                return (
                    <p key={record.role_id}>{record.role_name ?? (<span style={{color:"#f40"}}>Deleted</span>)}</p>
                )
            }
        },
        {
            dataIndex: 'key_field',
            title: 'Key value',
            key: 'key_field',
            render: (text,record) => {
                if (record.key_field) {
                    return (
                        <p key={record.key_field[1]}>{`${record.key_field[0]}: ${record.key_field[1]}`}</p>
                    )
                }
                else {
                    return (<div/>)
                }
            }
        },
        {
            dataIndex: 'fields',
            title: 'Attribute',
            key: 'fields',
            render: (text,record) => {
                if (record.key_field) {
                    if (record.key_field[0] == 'token_id') {
                        return (
                            <p key={Math.random()}>{`token amount: ${formatAmount(record.fields.token_amount, record.decimals)}`}</p>
                        )
                    } else if (record.key_field[0] == 'appchain_id') {
                        return (
                            <p key={Math.random()}>{`oct role: ${record.fields.oct_role}`}</p>
                        )
                    } else if (record.key_field[0] == 'near') {
                        return (
                            <p key={Math.random()}>{`near balance: ${formatAmount(record.fields.balance)}`}</p>
                        )
                    }
                }
                else {
                    return (<div/>)
                }
                
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (text, record) => (
                <Space size="middle">
                    <span onClick={()=>{handleDelete(record)}} style={{color:'#f40', cursor: 'pointer'}}>Delete</span>
                </Space>
            ),
        },
    ]

    const handleData = async (data) => {
        const roleList = await getRoleList(store.get("guild_id"));
        let serverName = server.name
        data.forEach(async (it, index) => {
            roleList.forEach(item => {
                if (item.id === it["role_id"]) {
                    it.role_name = item.name
                    it.guild_name = serverName
                    it.key = index;
                }
            })
        })
        console.log(data)
        roleList.forEach(item => {
            data.forEach((it, index) => {
                if (item.id === it["role_id"] && item.name!=='@everyone' && item.name) {
                    it.role_name = item.name
                    it.guild_name = serverName
                    it.key = index;
                    
                }
                
            })
        })
        for (let it of data) {
            if (it.key_field[0] === 'token_id') {
                let metadata = await account.viewFunction(it.key_field[1], "ft_metadata", {})
                it.token_symbol = metadata.symbol
                it.icon = metadata.icon
                it.decimals = metadata.decimals
            } else if (it.key_field[0] === 'appchain_id') {
                it.icon = test_icon
            } else if (it.key_field[0] === 'near') {
                it.icon = "https://near.org/wp-content/themes/near-19/assets/img/brand-icon.png"
            } else if (it.key_field[0] === 'nft_contract_id') {
                let metadata = await account.viewFunction(it.key_field[1], "nft_metadata", {})
                it.icon = metadata.icon
                it.name = metadata.name
            } else if (it.key_field[0] === 'x.paras.near') {
                it.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAn1BMVEUAAAAAAK8AALsAALkAALoAALoAALkAALsAALsAALsAALoAALgAALsAALgAALoAALcAAL8AALkAALoAALkAALgAALYAALrf3/a/v+6Pj+FQUNBAQMvPz/L///+vr+qAgNwwMMegoOXv7/twcNgQEL+QkOBgYNRQUM8gIMOvr+kQEL6fn+V/f91wcNmQkOGwsOrf3/cfH8LPz/MgIMJgYNPUXweEAAAAFnRSTlMAEHCv32BQ749/73CvsM9gEN+QgJBQjziFHwAAAAFiS0dEHesDcZEAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQflCAkCHB+v3qAcAAAIFElEQVR42u2dfV8bNxCEj4bQBEhomhaf37DxOYfBlLgv3/+z1cYJNGnQ7t3M3Sw/NH+DvfdYGmmlla4odjr46dXh+YvS4avXxaOOflbHI2HwgOCNOhSV3u6f/606Dp3e7J7/tToKpY62AF6Y+32r44OX3QDOz0+KU3UIWr0r3qtD0OqwUEegVgagDkCtDEAdgFoZgDoAtTIAdQBqZQDqANTKANQBqJUBqANQKwNQB6BWBqAOQK0MQB2AWhmAOgC1MgB1AGplAOoA1MoA1AGolQGoA1ArA1AHoFYGoA5ArQxAHYBaCIBBORyN1Q+gBDCZ7jS5mI3m6sfQALicPmhRDqvxUv0wfQP4NP1OWwzPrjEgAOrpD/W8+gQC4Gr6tJ5Nn0AArKaWBvH7BDQPMAF87RPVeKV+0E4ADJwEIvcJCMB1AwBRDRICcNkYwGOfiNIYIABVSwCR+gQEoEYABOkTEIA5DmCvUtcnIAA3LABf+4QgucTWAxZUApI+gQGY8AE8NIaepk4YgLbjoK8trPuAgAH4hD9mWoOLquP+gAEgjIO2FuWswyECA3CFP55Tk+GoGwgYADshZmrbEqIB8CbENA3WbEsAATRJiEma1JEANE+IGc2AiQAE0OlEIIGAN0EAAUAJMaLbIAB6mQh0SgAEQEuIm2sYAgA3IW6mPyIA6CIhdosyLUIBdJUQezSIAEA0Du41CwCg84Q4pQUhP0IBpMfB5fxqdt1hLyE0ARRAOiEe3f/NclzdlZ24JaEJoADSCXH1n7/cYrgu4zUBuEosGd/n//05uU8s9ACSCfFTA9X4itUn4LkADCCdEKf6KMUaSjmA9ERgZP4/2idQG4QBpBPiO+enzLd9YtMKAGqDMID0ROBzk4/a9YnGjQHtAzCAdELc3KWX27bQiMCfYgA3XYS3nTK43bFq9Q08AEZCbLvgU5pXvpYA9gEcQLrXel3wh1pdeowRGwdwAOlxEPx9Vo50u30j4wBIJ8TwXNVed4YaGQGAsTAMmrSDwF9iAMYOcQ1/gdkLIBPAARg7xFgD3enGGhGh/VLCoal0dHC2cn4+MwBAMwECgPQOMZ6xm01gLQZg7BDDLmiuvEIuSABghFfj3zBOfwPUyAgAjHEKd0GzDgMZBggAjHGQ4IKWDSLDAAGAsUNMcEGrD9RaANYOMaOsKT0OIOMg4/C0MUrVhK9IZ8aIzTAAGMtYDBdMjzTIRIABwJisY8nKXsSVxw4AGB7NcMF0woEMNAwAVqUUwwWTX4BUSjAAGIMUumx5r1Y7cH0BsEqmoWTliyaRAVgl0wwXTGdcagBWyTShkuUyNACrZJrggrEBWJVSBBeMDcBauCW4YGwA1tEhQkVjbABmyTTugrEBmCXTeFVvEgAy2ebcJWat3OMumMyH5RMhs2Qad8HgAKzdK9wFk3MtdTZo793gLjiNDcA8OoS6YDrfUq8I2Qkx7ILpL1CvCTrOEKMumJ5rIrWCpCs1LQCoC6bTLaRIhgTAPEMMumD68xGHIQEwzxBjLmjMtZENaBIA8+gQ5oJGuol8NAmAWcmELN1bG0Pq+oCdzLs0IBc0BhkILgmAfYYYcUFjoglVzJMA2GeIkaHKGGMgg2VdrW0WdwM/kzXRFtcJ7mUedAA6qtEA1JWie5nlnO1XbW6NT8am2SwAZkLceraysnpXHQKAfZdGSxdcmbNs7EIVFgB7HGyXs65Mc9lggbMA2JdqtVq2Gds3NYGZNu0NE+Y42MIFl0Pz8eHFJhoA+6dq6oLzW8/JMbAH8ADYl2pdVKPx/G/fpy3HQ+fpQXStiQbAfZfGYlOW69msfkLVbLhucooWXW6lARBdqoX2AB6A/i6X/EZ1GAD9Xi75IPhaORoAzaVa+KYj701TgsslCQ2ACEBxqRah9oYHQHGpFuFiSR4AOyGO2ACIAASXSzJuFuUB6P9yScZlckQAvU8E4EkgGUDfl0tuOFfrEgH0PBEg3bFNBNDvLdP/kKImAujzcskF6/mZAHpMiDe8O+aJAPpLiEviu0eIAPoaBxeMQ1hdAOgpIb7jvmqD+eLlHsbBxR37zTtMAJ0nxGXFf9EKE0CnCfGirJxL6joAnSXEm3V3L6NjAvAkxIuNW5OyXK9n9VUnP3wnADwJMeMygbAAPBMBxjHasAA8CTHjMoG4ADwTAcLFUnEBeBLiWv3EXQLwJMTRXJAKwJMQMy6WCgvAkxBHc0EqAFdCHMwFqQBcCXGtfuQOAbjGwWAuyAXgSYiDuSAXgCchDuaCXACuhDiWC3IBuHaIa/UzdwjAtUMcywW5AFwTAewEXWwArh3iWC5IBuBaGQ/lgmQArh1i7I0IsQG4dohDuSAZgGuHOJQLkgG4dogp7woNCsC3Q9zVJkcAAL4d4kguSAbgGwepG/zBALh2iCO5IBuAa4c4kguyAfh2iAO5IBuAr2Sa8tbwmAB8JdOBXJANwDcRYBT6BwXgK5kO5IJ0AL5SsTguSAfgK5mO44J0AL6S6TguSAfgK5mO44J0AL6S6TguSAfgLJkO44J0AM9NGYA6ALUyAHUAamUA6gDUygDUAaiVAagDUCsDUAegVgagDkCtDEAdgFoZgDoAtTIAdQBqZQDqANTKANQBqJUBqANQKwNQB6BWBqAOQK0MQB2AWhmAOgC1MgB1AGoVh+oItHpfnKpD0OpdcaIOQauz4pdjdQxKfSiK4kgdhFJnWwDFr+oodPpY3OujOg6Vfiu+6OyDOhSFjn8vHnV2+l4dT786PD05uH/yfwGfzk1OHMRnUAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMS0wOC0wOFQxOToyODozMSswNzowMIUIpr0AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjEtMDgtMDhUMTk6Mjg6MzErMDc6MDD0VR4BAAAAAElFTkSuQmCC"
                it.name = it.key_field[1]
            }
        }
        console.log("roleList>>>",data)
        return data;
    }

    useEffect(() => {
        (async () => {
            const search =  qs.parse(props.location.search.slice(1));
            store.set("info", {
                guild_id: search.guild_id,
                user_id: search.user_id,
                sign: search.sign
            }, { expires: 1 });

            const near = await connect(config);
            const wallet = new WalletConnection(near, 'nepbot');
            if (!wallet.isSignedIn()) {
                wallet.requestSignIn(config.RULE_CONTRACT, "nepbot")
                return
            }
            const accountId = wallet.getAccountId()
            
            const signature = await sign(wallet.account(), args)
            const now = Date.now()
            let operationSign = store.get("operationSign")
            const args = {
                account_id: accountId, 
                user_id: search.user_id,
                guild_id: search.guild_id,
                sign: search.sign,
                operationSign: operationSign
            }
            operationSign = await getOperationSign({
                args: args,
                account_id: accountId,
                sign: signature 
            })
            setOperationSign(operationSign)
            store.set("operationSign", operationSign)
            const server = await getServer(store.get("guild_id"));
            setServer(server);
            account = await wallet.account();
            const appchainIds = await account.viewFunction(config.OCT_CONTRACT, 'get_appchain_ids', {})
            setAppchainIds(appchainIds)

            const data = await account.viewFunction(config.RULE_CONTRACT, 'get_guild', {guild_id: server.id})
            const guildData = await handleData(data)
            setDataSource(guildData)
        })();
        return () => {
        }
    }, [addDialogStatus]);

    const handleAddStatus = useCallback(async () => {
        if (!addDialogStatus) {
            const roles = await getRoleList(store.get("guild_id"));
            setRoleList(roles.filter(item=>item.name!=="@everyone"))
        }
        setAddDialogStatus(!addDialogStatus)
    }, [addDialogStatus]);

    const handleDelete = async (record) =>{
        const near = await connect(config);
        const wallet = new WalletConnection(near, 'nepbot');
        account = await wallet.account();
        const obj = {
            guild_id: record.guild_id,
            role_id: record.role_id,
            key_field: record.key_field,
            fields: record.fields
        }
        const params = store.get("info")
        const args = {
            items: [obj],
            sign: operationSign,
            user_id: params.user_id,
            guild_id: params.guild_id,
        }
        const msg = {
            args: args,
            sign: await sign(account, args),
            account_id: account.accountId
        }
        console.log(msg)
        const _sign = await signRule(msg);
        console.log(_sign)

        const delRule = await account.functionCall(
            config.RULE_CONTRACT,
            'del_role',
            {args:JSON.stringify([obj]),..._sign},
            '300000000000000'
        );
        setTimeout(async ()=>{
            if(delRule){
                await handleReload()
            }
        })
    }
    const handleSearch = useCallback(async () => {
        const near = await connect(config);
        const wallet = new WalletConnection(near, 'nepbot');
        account = await wallet.account();
        if (!tokenId) {
            await handleReload();
        } else {
            // const account = await contract();
            const data = await account.viewFunction(config.RULE_CONTRACT, 'get_token', {token_id: tokenId})
            const _data = await handleData(data);
            console.log(_data)
            setDataSource(_data);
        }
        // eslint-disable-next-line
    }, [server.name, tokenId])

    const handleReload = async () => {
        const near = await connect(config);
        const wallet = new WalletConnection(near, 'nepbot');
        account = await wallet.account();
        const data = await account.viewFunction(config.RULE_CONTRACT, 'get_guild', {guild_id: server.id})
        const _data = await handleData(data)
        setDataSource(_data);
    }


    function SetRuleList(){
        if(dataSource.length>0){
            const setRuleItems = dataSource.map(item => 
                <div className={'setRule-item'} key={Math.random()}>
                    <div className={'guild-name'}>#{item.guild_name}</div>
                    <div className={'role_name'}>{item.role_name}</div>
                    <FileList item={item}/>
                    <img className={'token-icon'} src={item.icon}/>
                    <div className={'delete-btn'} onClick={()=>{handleDelete(item)}}>delete</div>
                </div>
            );
            
            return (<div className={'setRule-list'}>
                {setRuleItems}
            </div>)
        }else{
            return (<div className={'no-data'}>
                <img src={no_data}/>
                <div className={'tip'}>No data, Please add a rule.</div>
                <div className={'btn'} onClick={handleAddStatus}>+ Add</div>
            </div>)
        }
    }


    function FileList(props){
        if(props.item.key_field){
            if (props.item.key_field[0] == "token_id") {
                return (<div className={'file-list'}>
                    <div>{`token: ${props.item.token_symbol}`}</div>
                    <div>{`amount: ${formatAmount(props.item.fields.token_amount, props.item.decimals)}`}</div>
                </div>)
            } else if (props.item.key_field[0] == "appchain_id") {
                return (<div className={'file-list'}>
                    <div>{`appchain: ${props.item.key_field[1]}`}</div>
                    <div>{`role: ${props.item.fields.oct_role}`}</div>
                </div>)
            } else if (props.item.key_field[0] == "near") {
                return (<div className={'file-list'}>
                    <div>{`near balance: ${formatAmount(props.item.fields.balance)}`}</div>
                </div>)
            } else if (props.item.key_field[0] == "nft_contract_id") {
                return (<div className={'file-list'}>
                    <div>{`NFT: ${props.item.name}`}</div>
                    <div>{`amount: ${props.item.fields.token_amount}`}</div>
                </div>)
            } else if (props.item.key_field[0] == "x.paras.near") {
                return (<div className={'file-list'}>
                    <div>{`NFT: ${props.item.name}`}</div>
                    <div>{`amount: ${props.item.fields.token_amount}`}</div>
                </div>)
            }
            
        }else{
            return (<div></div>);
        }
        
    }


    return (
        <div className={'setRule-box'}>
            <div className={'nav-bar'}>
                <div className={'add-btn'} onClick={handleAddStatus}>+ Add</div>
            </div>
            <div className={'setRule-content'}>
                <SetRuleList/>
                {/* <Table loading={tableStatus} columns={columns} dataSource={dataSource} rowKey={(record)=>`rest${record.key*Math.random()}`}/> */}
                <AddRule title="Basic Modal" appchainIds={appchainIds} roleList={roleList} server={server} visible={addDialogStatus}
                        onOk={handleAddStatus} onCancel={handleAddStatus}/>
            </div>
        </div>
    );
}

export default SetRule;
