// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UsernameNFT
 * @notice Smart contract for minting paired usernames as tradeable NFTs
 * @dev Each paired username is an ERC721 token with metadata
 */
contract UsernameNFT is ERC721, Ownable {
    
    // Token ID counter
    uint256 private _tokenIds;
    
    // Platform fee (1% = 100 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 100; // 1%
    uint256 public constant BASIS_POINTS = 10000;
    
    // Minimum price for paired username (0.7 USDC in wei - 6 decimals)
    uint256 public constant MIN_PRICE = 700000; // 0.7 USDC
    
    // Platform treasury address
    address public treasury;
    
    // USDC contract address (configurable for testnet/mainnet)
    // Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    // Base Sepolia: Will use mock/testnet USDC
    address public immutable USDC;
    
    // Struct to store paired username data
    struct PairedUsername {
        string username1;
        string platform1;
        string username2;
        string platform2;
        string pairedName;
        address creator;
        uint256 currentPrice;
        uint256 totalVolume;
        bool forSale;
        uint256 timestamp;
    }
    
    // Mapping from token ID to paired username data
    mapping(uint256 => PairedUsername) public pairedUsernames;
    
    // Mapping from paired name to token ID
    mapping(string => uint256) public pairedNameToTokenId;
    
    // Events
    event UsernamePaired(
        uint256 indexed tokenId,
        address indexed creator,
        string pairedName,
        string username1,
        string username2
    );
    
    event UsernameListed(
        uint256 indexed tokenId,
        uint256 price
    );
    
    event UsernameSold(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 price,
        uint256 platformFee
    );
    
    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    
    constructor(address _treasury) ERC721("Names Paired Username", "NAMES") Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        
        // Auto-detect USDC based on chain ID
        uint256 chainId = block.chainid;
        
        if (chainId == 8453) {
            // Base Mainnet
            USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        } else if (chainId == 84532) {
            // Base Sepolia - use mock USDC for testing
            // For testnet, we'll allow native ETH or mock token
            USDC = address(0); // Set to 0 for testnet (will use ETH)
        } else {
            revert("Unsupported chain");
        }
    }
    
    /**
     * @notice Mint a new paired username NFT
     * @param _username1 First username
     * @param _platform1 First platform
     * @param _username2 Second username
     * @param _platform2 Second platform
     * @return tokenId The ID of the newly minted NFT
     */
    function mintPairedUsername(
        string memory _username1,
        string memory _platform1,
        string memory _username2,
        string memory _platform2
    ) external returns (uint256) {
        require(bytes(_username1).length > 0, "Username1 cannot be empty");
        require(bytes(_username2).length > 0, "Username2 cannot be empty");
        
        // Generate paired name
        string memory pairedName = string(abi.encodePacked(_username1, unicode"×", _username2));
        
        // Check if paired name already exists
        require(pairedNameToTokenId[pairedName] == 0, "Paired name already exists");
        
        // Increment token ID
        uint256 newTokenId = ++_tokenIds;
        
        // Mint NFT to creator
        _safeMint(msg.sender, newTokenId);
        
        // Store paired username data
        pairedUsernames[newTokenId] = PairedUsername({
            username1: _username1,
            platform1: _platform1,
            username2: _username2,
            platform2: _platform2,
            pairedName: pairedName,
            creator: msg.sender,
            currentPrice: MIN_PRICE,
            totalVolume: 0,
            forSale: false,
            timestamp: block.timestamp
        });
        
        // Map paired name to token ID
        pairedNameToTokenId[pairedName] = newTokenId;
        
        emit UsernamePaired(newTokenId, msg.sender, pairedName, _username1, _username2);
        
        return newTokenId;
    }
    
    /**
     * @notice List a paired username for sale
     * @param _tokenId Token ID to list
     * @param _price Price in USDC (6 decimals) or ETH (18 decimals for testnet)
     */
    function listForSale(uint256 _tokenId, uint256 _price) external {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(_price >= MIN_PRICE, "Price below minimum");
        
        PairedUsername storage paired = pairedUsernames[_tokenId];
        paired.forSale = true;
        paired.currentPrice = _price;
        
        emit UsernameListed(_tokenId, _price);
    }
    
    /**
     * @notice Buy a paired username
     * @param _tokenId Token ID to buy
     */
    function buyPairedUsername(uint256 _tokenId) external payable {
        PairedUsername storage paired = pairedUsernames[_tokenId];
        require(paired.forSale, "Not for sale");
        
        address seller = ownerOf(_tokenId);
        require(seller != msg.sender, "Cannot buy your own");
        
        uint256 price = paired.currentPrice;
        
        // Calculate platform fee (1%)
        uint256 platformFee = (price * PLATFORM_FEE_BPS) / BASIS_POINTS;
        uint256 sellerAmount = price - platformFee;
        
        if (USDC == address(0)) {
            // Testnet mode: use native ETH
            require(msg.value >= price, "Insufficient ETH sent");
            
            // Transfer ETH to seller
            (bool successSeller, ) = payable(seller).call{value: sellerAmount}("");
            require(successSeller, "Transfer to seller failed");
            
            // Transfer platform fee to treasury
            (bool successTreasury, ) = payable(treasury).call{value: platformFee}("");
            require(successTreasury, "Transfer to treasury failed");
            
            // Refund excess ETH
            if (msg.value > price) {
                (bool successRefund, ) = payable(msg.sender).call{value: msg.value - price}("");
                require(successRefund, "Refund failed");
            }
        } else {
            // Mainnet mode: use USDC
            // Transfer USDC from buyer to seller
            require(
                IERC20(USDC).transferFrom(msg.sender, seller, sellerAmount),
                "Transfer to seller failed"
            );
            
            // Transfer platform fee to treasury
            require(
                IERC20(USDC).transferFrom(msg.sender, treasury, platformFee),
                "Transfer to treasury failed"
            );
        }
        
        // Transfer NFT to buyer
        _transfer(seller, msg.sender, _tokenId);
        
        // Update data
        paired.forSale = false;
        paired.totalVolume += price;
        
        emit UsernameSold(_tokenId, seller, msg.sender, price, platformFee);
    }
    
    /**
     * @notice Unlist a paired username from sale
     * @param _tokenId Token ID to unlist
     */
    function unlistFromSale(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        
        pairedUsernames[_tokenId].forSale = false;
    }
    
    /**
     * @notice Update treasury address
     * @param _newTreasury New treasury address
     */
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        
        address oldTreasury = treasury;
        treasury = _newTreasury;
        
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    /**
     * @notice Get paired username data
     * @param _tokenId Token ID
     */
    function getPairedUsername(uint256 _tokenId) 
        external 
        view 
        returns (PairedUsername memory) 
    {
        return pairedUsernames[_tokenId];
    }
    
    /**
     * @notice Get total supply of paired usernames
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }
    
    /**
     * @notice Check if contract is on testnet
     */
    function isTestnet() external view returns (bool) {
        return USDC == address(0);
    }
}

// IERC20 Interface
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
