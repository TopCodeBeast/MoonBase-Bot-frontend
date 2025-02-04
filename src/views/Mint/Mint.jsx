import React, { useEffect, useState} from 'react';
import {useHistory} from 'react-router-dom'
import {getMintSign, setInfo} from "../../api/api";
import store from "../../store/discordInfo";
import {sign} from "../../utils/util";
import {connect, WalletConnection} from "near-api-js";
import {getConfig} from "../../config";
import qs from "qs";
import './Mint.css';
import load from '../../assets/images/load.gif';
import BN from 'bn.js'
import { requestTransaction } from '../../utils/contract';

const config = getConfig()

export default function Success(props) {
    const history = useHistory()
    useEffect(()=>{

        (async ()=>{
            const search =  qs.parse(props.location.search.slice(1));
            store.set("info", {
                guild_id: search.guild_id,
                user_id: search.user_id,
                collection_id: search.collection_id,
                sign: search.sign
            }, { expires: 1 });

            const near = await connect(config);
            const wallet = new WalletConnection(near, 'nepbot');
            const account = wallet.account(); 

            try {
                await wallet._completeSignInWithAccessKey()
            } catch {}

            if (!wallet.isSignedIn()) {
                wallet.requestSignIn(config.RULE_CONTRACT, "nepbot")
                return
            }
            
            let collection = null;
            try{
                collection = await account.viewFunction(config.NFT_CONTRACT, "get_collection", {collection_id: search.collection_id})
                // const minted_count = await account.viewFunction(config.NFT_CONTRACT, "get_minted_count_by_collection", {collection_id: search.collection_id})
                // console.log(collection,minted_count,'-----count_res-----');
                // if(minted_count >= collection.mint_count_limit){
                //     history.push({pathname: `/failure`})
                // }
            }catch(e){
                console.log(e);
                history.push({pathname: `/failure`})
            }
            const price = new BN(collection.price).add(new BN('20000000000000000000000'))

            const accountId = wallet.getAccountId()
            const args = {
                user_id: search.user_id,
                guild_id: search.guild_id,
                collection_id: search.collection_id,
                sign: search.sign
            }
           
            const signature = await sign(wallet.account(), args)
            const _sign = await getMintSign({
                args: args,
                account_id: accountId,
                sign: signature
            })
            if(!_sign) {
                history.push({pathname: '/linkexpired', })
                return
            }
            const res = await requestTransaction(
                account,
                config.NFT_CONTRACT,
                "nft_mint",
                {
                    collection_id: search.collection_id,
                    ..._sign
                },
                '300000000000000',
                price.toString(),
                `${config.PARAS}/${accountId}/collectibles`
            )
                
        })();
        return ()=>{

        }
    },[props, props.history, props.location.search])

    // const handleDiscord = useCallback(()=>{
    //     window.open('https://discord.com/channels/','_self')
    // },[])

    return (
        <div className={'loading-box'}>
            <div className={'loading-content'}>
                <img src={load}/>
                <div className={'text'}>Loading…</div>
            </div>
        </div>

    );
}
