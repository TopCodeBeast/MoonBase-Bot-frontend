import React, { useEffect} from 'react';
import {useHistory} from 'react-router-dom';
import {connect, WalletConnection} from "near-api-js";
import {getConfig} from "../../config";
import qs from "qs";
import './Airdrop.css';
import load from '../../assets/images/load.gif';
import { requestTransaction } from '../../utils/contract';

const config = getConfig()

export default function Success(props) {
    const history = useHistory();
    useEffect(()=>{

        (async ()=>{
            const search =  qs.parse(props.location.search.slice(1));
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

            const res = await requestTransaction(
                account,
                config.AIRDROP_CONTRACT,
                "redeem",
                {
                    hash:search.hash,
                },
                '300000000000000',
                '0',
                'https://discord.com/channels/'
            )
            
            if(window.localStorage.getItem("isSender") && !res){
                history.push({pathname: `/failure`,search:'from=airdrop'})
            }
                
        })();
        return ()=>{

        }
    },[props, props.history, props.location.search])


    return (
        <div className={'loading-box'}>
            <div className={'loading-content'}>
                <img src={load}/>
                <div className={'text'}>Loading…</div>
            </div>
        </div>

    );
}
